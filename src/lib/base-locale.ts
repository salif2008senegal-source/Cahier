import type { Dette } from "./types";

const NOM_BASE = "cahier-v2";
const NOM_TABLE = "dettes";

let connexion: Promise<IDBDatabase> | null = null;

function ouvrir(): Promise<IDBDatabase> {
  if (connexion) return connexion;
  connexion = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Stockage local indisponible"));
      return;
    }
    const demande = indexedDB.open(NOM_BASE, 1);
    demande.onupgradeneeded = () => {
      const base = demande.result;
      if (!base.objectStoreNames.contains(NOM_TABLE)) {
        base.createObjectStore(NOM_TABLE, { keyPath: "id" });
      }
    };
    demande.onsuccess = () => resolve(demande.result);
    demande.onerror = () => reject(demande.error);
  });
  connexion.catch(() => {
    connexion = null;
  });
  return connexion;
}

export async function lireDettes(): Promise<Dette[]> {
  const base = await ouvrir();
  return new Promise<Dette[]>((resolve, reject) => {
    const demande = base.transaction(NOM_TABLE, "readonly").objectStore(NOM_TABLE).getAll();
    demande.onsuccess = () => resolve(demande.result as Dette[]);
    demande.onerror = () => reject(demande.error);
  });
}

export async function ecrireDettes(dettes: Dette[]): Promise<void> {
  if (dettes.length === 0) return;
  const base = await ouvrir();
  return new Promise<void>((resolve, reject) => {
    const transaction = base.transaction(NOM_TABLE, "readwrite");
    const magasin = transaction.objectStore(NOM_TABLE);
    dettes.forEach((dette) => magasin.put(dette));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

// Utilisé quand un autre boutiquier se connecte sur le même téléphone
export async function viderDettes(): Promise<void> {
  const base = await ouvrir();
  return new Promise<void>((resolve, reject) => {
    const transaction = base.transaction(NOM_TABLE, "readwrite");
    transaction.objectStore(NOM_TABLE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}