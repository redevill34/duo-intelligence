// @vitest-environment node
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { LocalDatabase } from "@/services/local/database";
import { LocalVault } from "@/services/local/vault";
import { deriveKey, newSalt, open, readBackup, seal, validateSnapshot } from "@/services/local/crypto";
import { refuseOfflineRegistration } from "@/lib/offline";
import type { LocalSnapshot } from "@/domain/schemas";

const identity = { userId: "alice", spaceId: "duo" };
const pass = "une longue phrase locale de test";
const seed = (): LocalSnapshot => ({ sharedAi: { suspended: false, reactivationApprovals: [] }, events: [], conversations: [], proposals: [], tasks: [{ id: "one", spaceId: "duo", title: "CONFIDENTIEL rendez-vous", assigneeId: "alice", visibility: "private", status: "todo" }] });

describe("Local encrypted vault", () => {
  it("persists and reads back after a fresh service instance", async () => {
    const db = new LocalDatabase("reload");
    await new LocalVault(identity, db).create(pass, seed());
    expect(await new LocalVault(identity, db).unlock(pass)).toEqual(seed());
  });
  it("never stores readable sensitive content or passphrase in IndexedDB", async () => {
    const db = new LocalDatabase("cipher");
    await new LocalVault(identity, db).create(pass, seed());
    const stored = JSON.stringify(await db.read(identity));
    expect(stored).not.toContain("CONFIDENTIEL"); expect(stored).not.toContain(pass);
    expect(stored).not.toContain("rendez-vous");
  });
  it("isolates account and space keys", async () => {
    const db = new LocalDatabase("isolation");
    await new LocalVault(identity, db).create(pass, seed());
    expect(await db.read({ ...identity, userId: "bob" })).toBeUndefined();
    expect(await db.read({ ...identity, spaceId: "elsewhere" })).toBeUndefined();
  });
  it("rejects another account even when ciphertext is copied", async () => {
    const salt = newSalt(); const key = await deriveKey(pass, salt);
    const encrypted = await seal(seed(), identity, key, salt);
    await expect(open(encrypted, { ...identity, userId: "bob" }, key)).rejects.toThrow("Compte ou espace");
  });
  it("rejects private data belonging to a partner and foreign spaces", () => {
    const data = seed(); const task = data.tasks[0]; if (!task) throw new Error("missing seed");
    task.assigneeId = "bob"; expect(() => validateSnapshot(data, identity)).toThrow("autre compte");
    task.assigneeId = "alice"; task.spaceId = "foreign"; expect(() => validateSnapshot(data, identity)).toThrow("autre espace");
  });
  it("rejects incorrect keys and leaves the stored data intact", async () => {
    const db = new LocalDatabase("wrong-key"); const vault = new LocalVault(identity, db);
    await vault.create(pass, seed()); const before = await db.read(identity);
    await expect(new LocalVault(identity, db).unlock("incorrect password test")).rejects.toThrow("incorrecte");
    expect(await db.read(identity)).toEqual(before);
  });
  it("rejects corrupted encrypted backups", async () => {
    const vault = new LocalVault(identity, new LocalDatabase("corrupt")); await vault.create(pass, seed());
    const envelope = JSON.parse(await vault.export(seed()));
    envelope.ciphertext = (envelope.ciphertext[0] === "A" ? "B" : "A") + envelope.ciphertext.slice(1);
    await expect(readBackup(JSON.stringify(envelope), identity, pass)).rejects.toThrow("endommagées");
  });
  it.each([0, 2])("rejects unsupported backup version %s without mutation", async version => {
    await expect(readBackup(JSON.stringify({ version }), identity, pass)).rejects.toThrow("Version");
  });
  it("exports/restores the current format with exact round-trip data", async () => {
    const vault = new LocalVault(identity, new LocalDatabase("roundtrip")); await vault.create(pass, seed());
    const text = await vault.export(seed()); const restored = await readBackup(text, identity, pass);
    expect(restored).toEqual(seed()); await vault.save(restored);
    expect(await vault.unlock(pass)).toEqual(seed());
  });
  it("uses random salt/IV and authenticated metadata", async () => {
    const salt = newSalt(); const key = await deriveKey(pass, salt);
    const first = await seal(seed(), identity, key, salt); const second = await seal(seed(), identity, key, salt);
    expect(first.iv).not.toBe(second.iv); expect(first.ciphertext).not.toBe(second.ciphertext);
    await expect(open({ ...first, salt: newSalt() }, identity, key)).rejects.toThrow();
  });
  it("keeps the first daily checkpoint and refreshes only on a new UTC day", async () => {
    const vault = new LocalVault(identity, new LocalDatabase("daily")); await vault.create(pass, seed());
    const data = seed(); data.tasks = [];
    await vault.save(data); expect((await vault.dailySnapshot()).tasks).toHaveLength(1);
    await vault.save(data, new Date("2099-01-02T10:00:00Z"));
    expect((await vault.dailySnapshot()).tasks).toHaveLength(0);
    expect((await vault.status()).dailyAt).toBe("2099-01-02T10:00:00.000Z");
  });
  it("serializes writes and denies writes after locking", async () => {
    const vault = new LocalVault(identity, new LocalDatabase("queue")); await vault.create(pass, seed());
    const empty = seed(); empty.tasks = [];
    await Promise.all([vault.save(seed()), vault.save(empty)]);
    await vault.lock(); await expect(vault.save(seed())).rejects.toThrow("verrouillé");
    expect((await vault.unlock(pass)).tasks).toHaveLength(0);
  });
  it("rejects invalid schema and duplicate row IDs", () => {
    expect(() => validateSnapshot({ ...seed(), tasks: [{ invalid: true }] }, identity)).toThrow();
    const data = seed(); data.tasks = [...data.tasks, ...data.tasks]; expect(() => validateSnapshot(data, identity)).toThrow("double");
  });
});

describe("Offline registration guards", () => {
  it.each(["id-preview--abc.lovable.app", "preview-2--abc.gpt-eng.com", "project--abc-dev.lovable.app", "app.lovableproject.com", "beta.lovable.dev"])("refuses preview %s", host => {
    expect(refuseOfflineRegistration(host, true, false, "")).toBe(true);
  });
  it("refuses dev, iframe and explicit kill switch; allows published custom domains", () => {
    expect(refuseOfflineRegistration("duo.example.com", false, false, "")).toBe(true);
    expect(refuseOfflineRegistration("duo.example.com", true, true, "")).toBe(true);
    expect(refuseOfflineRegistration("duo.example.com", true, false, "?sw=off")).toBe(true);
    expect(refuseOfflineRegistration("duo.example.com", true, false, "")).toBe(false);
    expect(refuseOfflineRegistration("preview-v2--shop.example.com", true, false, "")).toBe(false);
  });
});