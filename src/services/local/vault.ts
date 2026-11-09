import { type LocalSnapshot } from "@/domain/schemas";
import { deriveKey, newSalt, open, seal, type VaultIdentity } from "./crypto";
import { LocalDatabase } from "./database";

// Serialized commits prevent late writes from replacing newer edits. No persisted key.
export class LocalVault {
  private key: CryptoKey | undefined;
  private salt = "";
  private queue: Promise<unknown> = Promise.resolve();
  constructor(readonly identity: VaultIdentity, private db = new LocalDatabase()) {}
  async exists() { return !!(await this.db.read(this.identity)); }
  async unlock(passphrase: string) {
    const record = await this.db.read(this.identity);
    if (!record) throw new Error("Aucun coffre local. Créez-le d’abord.");
    const key = await deriveKey(passphrase, record.envelope.salt);
    const snapshot = await open(record.envelope, this.identity, key);
    this.key = key; this.salt = record.envelope.salt;
    return snapshot;
  }
  async create(passphrase: string, snapshot: LocalSnapshot) {
    if (await this.exists()) throw new Error("Un coffre existe déjà : déverrouillez-le.");
    this.salt = newSalt(); this.key = await deriveKey(passphrase, this.salt);
    await this.save(snapshot);
  }
  save(snapshot: LocalSnapshot, now = new Date()): Promise<void> {
    const key = this.key;
    if (!key) return Promise.reject(new Error("Coffre verrouillé."));
    const copy = structuredClone(snapshot);
    const salt = this.salt;
    const run = async () => {
      const envelope = await seal(copy, this.identity, key, salt);
      const previous = await this.db.read(this.identity);
      const today = now.toISOString().slice(0, 10);
      const daily = previous?.daily?.createdAt.slice(0, 10) === today ? previous.daily : { envelope, createdAt: now.toISOString() };
      await this.db.write(this.identity, { envelope, daily, exportedAt: previous?.exportedAt });
    };
    const pending = this.queue.then(run, run);
    this.queue = pending;
    return pending;
  }
  async export(snapshot: LocalSnapshot) {
    await this.save(snapshot);
    const record = await this.db.read(this.identity);
    if (!record) throw new Error("Coffre introuvable.");
    return JSON.stringify(record.envelope);
  }
  async markExported() {
    const record = await this.db.read(this.identity);
    if (record) await this.db.write(this.identity, { ...record, exportedAt: new Date().toISOString() });
  }
  async status() { const r = await this.db.read(this.identity); return { dailyAt: r?.daily?.createdAt, exportedAt: r?.exportedAt }; }
  async dailySnapshot() {
    const record = await this.db.read(this.identity);
    if (!record?.daily || !this.key) throw new Error("Point quotidien indisponible.");
    return open(record.daily.envelope, this.identity, this.key);
  }
  async lock() { await this.queue.catch(() => {}); this.key = undefined; this.salt = ""; }
}