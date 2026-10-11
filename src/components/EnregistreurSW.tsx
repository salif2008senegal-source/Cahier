"use client";

import { useEffect } from "react";

export default function EnregistreurSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((liste) => liste.forEach((r) => r.unregister()));
      return;
    }

    const enregistrer = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        /* le mode hors-ligne ne sera pas disponible, l'application marche quand même */
      });
    };
    if (document.readyState === "complete") enregistrer();
    else window.addEventListener("load", enregistrer, { once: true });
  }, []);

  return null;
}