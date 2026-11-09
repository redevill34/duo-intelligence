import { type Envelope, type VaultIdentity } from "./crypto";

const keyFor = (identity: VaultIdentity) => JSON.stringify([identity.userId, identity.spaceId]);
type RecordValue = { envelope: Envelope; daily?: { envelope: Envelope; createdAt: string }; exportedAt?: string | undefined };

export class LocalDatabase {
  constructor(private name = "duo-encrypted-v1") {}
  private async transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("vaults");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Stockage local indisponible."));
      request.onblocked = () => reject(new Error("Fermez les autres onglets DUO."));
    });
    return new Promise((resolve, reject) => {
      const tx = db.transaction("vaults", mode);
      const request = operation(tx.objectStore("vaults"));
      tx.oncomplete = () => { db.close(); resolve(request.result); };
      tx.onabort = tx.onerror = () => { db.close(); reject(new Error("Enregistrement impossible : espace disque ou stockage indisponible.")); };
    });
  }
  read(identity: VaultIdentity): Promise<RecordValue | undefined> { return this.transaction("readonly", store => store.get(keyFor(identity))); }
  write(identity: VaultIdentity, value: RecordValue): Promise<IDBValidKey> { return this.transaction("readwrite", store => store.put(value, keyFor(identity))); }
}