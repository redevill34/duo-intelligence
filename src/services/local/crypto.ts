import {
  encryptedVaultSchema,
  localSnapshotSchema,
  vaultIdentitySchema,
  type LocalSnapshot,
} from "@/domain/schemas";

export type VaultIdentity = { userId: string; spaceId: string };
export type Envelope = ReturnType<typeof encryptedVaultSchema.parse>;
const encode = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
const decode = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const bytes = (text: string) => new TextEncoder().encode(text);
const aad = (e: Envelope) =>
  bytes(JSON.stringify([e.format, e.version, e.kdf, e.iterations, e.salt]));

export async function deriveKey(passphrase: string, salt: string): Promise<CryptoKey> {
  if (passphrase.length < 12 || passphrase.length > 1024)
    throw new Error("Phrase de passe : 12 à 1024 caractères.");
  const material = await crypto.subtle.importKey("raw", bytes(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: decode(salt), iterations: 600000 },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function newSalt() {
  return encode(crypto.getRandomValues(new Uint8Array(16)));
}

export function validateSnapshot(data: unknown, identity: VaultIdentity): LocalSnapshot {
  vaultIdentitySchema.parse(identity);
  const snapshot = localSnapshotSchema.parse(data);
  const rows = [
    ...snapshot.tasks,
    ...snapshot.events,
    ...snapshot.conversations,
    ...snapshot.proposals,
  ];
  if (rows.some((row) => row.spaceId !== identity.spaceId))
    throw new Error("Cette sauvegarde appartient à un autre espace.");
  if (
    snapshot.tasks.some(
      (row) => row.visibility === "private" && row.assigneeId !== identity.userId,
    ) ||
    snapshot.events.some(
      (row) => row.visibility === "private" && row.ownerId !== identity.userId,
    ) ||
    snapshot.conversations.some(
      (row) =>
        row.visibility === "private" &&
        (row.participantIds.length !== 1 || row.participantIds[0] !== identity.userId),
    )
  ) {
    throw new Error("Données privées d’un autre compte refusées.");
  }
  for (const list of [
    snapshot.tasks,
    snapshot.events,
    snapshot.conversations,
    snapshot.proposals,
  ]) {
    if (new Set(list.map((row) => row.id)).size !== list.length)
      throw new Error("Identifiants en double.");
  }
  return snapshot;
}

export async function seal(
  snapshot: LocalSnapshot,
  identity: VaultIdentity,
  key: CryptoKey,
  salt: string,
): Promise<Envelope> {
  const envelope: Envelope = {
    format: "duo-vault",
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations: 600000,
    salt,
    iv: encode(crypto.getRandomValues(new Uint8Array(12))),
    ciphertext: "",
  };
  const plaintext = JSON.stringify({
    identity: vaultIdentitySchema.parse(identity),
    snapshot: validateSnapshot(snapshot, identity),
  });
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: decode(envelope.iv), additionalData: aad(envelope) },
    key,
    bytes(plaintext),
  );
  return { ...envelope, ciphertext: encode(new Uint8Array(cipher)) };
}

export async function open(
  input: unknown,
  identity: VaultIdentity,
  key: CryptoKey,
): Promise<LocalSnapshot> {
  const envelope = encryptedVaultSchema.parse(input);
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: decode(envelope.iv), additionalData: aad(envelope) },
      key,
      decode(envelope.ciphertext),
    );
  } catch {
    throw new Error("Phrase de passe incorrecte ou données endommagées.");
  }
  const data = JSON.parse(new TextDecoder().decode(plaintext));
  const storedIdentity = vaultIdentitySchema.parse(data.identity);
  if (storedIdentity.userId !== identity.userId || storedIdentity.spaceId !== identity.spaceId)
    throw new Error("Compte ou espace différent.");
  return validateSnapshot(data.snapshot, identity);
}

export async function readBackup(text: string, identity: VaultIdentity, passphrase: string) {
  if (text.length > 28000000) throw new Error("Sauvegarde trop volumineuse.");
  const raw = JSON.parse(text);
  if (raw.version !== 1)
    throw new Error("Version de sauvegarde non prise en charge. Le fichier original est conservé.");
  const envelope = encryptedVaultSchema.parse(raw);
  const key = await deriveKey(passphrase, envelope.salt);
  return open(envelope, identity, key);
}
