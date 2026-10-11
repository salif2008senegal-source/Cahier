/* Cahier : service worker fait main. Au premier lancement, il garde les pages en cache,
   ensuite l'application s'ouvre même sans données mobiles.
   Pour forcer une mise à jour chez tout le monde, changez VERSION. */

const VERSION = "cahier-v2";
const PAGES = ["/", "/regle", "/nouveau", "/connexion"];
const FIXES = ["/manifest.webmanifest", "/icones/192", "/icones/512", "/icones/180"];
const DELAI_RESEAU_MS = 4000;

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(precharger().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom !== VERSION).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim())
  );
});

async function precharger() {
  const cache = await caches.open(VERSION);
  await Promise.allSettled(FIXES.map((adresse) => cache.add(adresse)));

  for (const page of PAGES) {
    try {
      const reponse = await fetch(page, { cache: "reload" });
      if (!reponse.ok) continue;
      const html = await reponse.clone().text();
      await cache.put(page, reponse);

      // On garde aussi les fichiers (JS, CSS, polices) cités dans la page
      const fichiers = new Set(html.match(/\/_next\/static\/[^"'\\\s<>)]+/g) || []);
      await Promise.allSettled(
        Array.from(fichiers).map(async (adresse) => {
          if (!(await cache.match(adresse))) await cache.add(adresse);
        })
      );
    } catch (erreur) {
      // pas de réseau pendant l'installation : on réessaiera au prochain lancement
    }
  }
}

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;
  if (requete.method !== "GET") return;

  const adresse = new URL(requete.url);
  if (adresse.origin !== self.location.origin) return; // Supabase & co : jamais interceptés

  if (adresse.pathname.startsWith("/_next/static/") || adresse.pathname.startsWith("/icones/")) {
    evenement.respondWith(cacheDAbord(requete));
    return;
  }

  if (requete.mode === "navigate") {
    evenement.respondWith(reseauDAbord(requete));
  }
});

async function cacheDAbord(requete) {
  const cache = await caches.open(VERSION);
  const trouve = await cache.match(requete, { ignoreVary: true });
  if (trouve) return trouve;
  const reponse = await fetch(requete);
  if (reponse.ok) cache.put(requete, reponse.clone());
  return reponse;
}

async function reseauDAbord(requete) {
  const cache = await caches.open(VERSION);
  const chemin = new URL(requete.url).pathname;
  try {
    const reponse = await Promise.race([
      fetch(requete),
      new Promise((_, rejeter) => setTimeout(() => rejeter(new Error("réseau trop lent")), DELAI_RESEAU_MS)),
    ]);
    if (reponse.ok && reponse.type === "basic") cache.put(chemin, reponse.clone());
    return reponse;
  } catch (erreur) {
    const enCache =
      (await cache.match(chemin, { ignoreVary: true })) || (await cache.match("/", { ignoreVary: true }));
    if (enCache) return enCache;
    return new Response("Pas de connexion. Ouvrez Cahier une première fois avec internet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}