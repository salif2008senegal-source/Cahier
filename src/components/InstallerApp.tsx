"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoCahier } from "./Icones.tsx";

type EvenementInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "natif" | "ios" | "manuel";

const CLE_IGNOREE = "cahier:installation-ignoree";
const CLE_INSTALLEE = "cahier:installee";
const PAUSE_MS = 2 * 24 * 60 * 60 * 1000; // après « Plus tard », on repropose dans 2 jours

function lire(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string): void {
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    /* stockage indisponible : on proposera de nouveau, sans gravité */
  }
}

function dejaInstallee(): boolean {
  const iphone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iphone || window.matchMedia("(display-mode: standalone)").matches || lire(CLE_INSTALLEE) !== null;
}

function recemmentIgnoree(): boolean {
  const quand = Number(lire(CLE_IGNOREE));
  return quand > 0 && Date.now() - quand < PAUSE_MS;
}

function IconePartager() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: "inline-block", verticalAlign: "-4px" }}
    >
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

export default function InstallerApp() {
  const chemin = usePathname() ?? "/";
  const evenement = useRef<EvenementInstallation | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [ferme, setFerme] = useState(false);

  useEffect(() => {
    if (dejaInstallee() || recemmentIgnoree()) return;

    const minuteurs: number[] = [];

    // Android (Chrome) : le navigateur nous prête sa fenêtre d'installation
    const surInvite = (e: Event) => {
      e.preventDefault();
      evenement.current = e as EvenementInstallation;
      minuteurs.push(window.setTimeout(() => setMode("natif"), 1200));
    };
    const surInstallee = () => {
      ecrire(CLE_INSTALLEE, "1");
      setMode(null);
    };
    window.addEventListener("beforeinstallprompt", surInvite);
    window.addEventListener("appinstalled", surInstallee);

    const agent = navigator.userAgent;
    const iphone =
      /iphone|ipad|ipod/i.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const android = /android/i.test(agent);

    // iPhone : pas de fenêtre automatique, on montre quoi toucher
    if (iphone) minuteurs.push(window.setTimeout(() => setMode("ios"), 1500));
    // Autre navigateur Android : si rien n'est arrivé après 6 s, on explique le menu
    else if (android) minuteurs.push(window.setTimeout(() => setMode((actuel) => actuel ?? "manuel"), 6000));

    return () => {
      minuteurs.forEach((m) => window.clearTimeout(m));
      window.removeEventListener("beforeinstallprompt", surInvite);
      window.removeEventListener("appinstalled", surInstallee);
    };
  }, []);

  function plusTard() {
    ecrire(CLE_IGNOREE, String(Date.now()));
    setFerme(true);
  }

  async function installer() {
    const e = evenement.current;
    if (!e) return;
    try {
      await e.prompt();
      const choix = await e.userChoice;
      if (choix.outcome === "accepted") ecrire(CLE_INSTALLEE, "1");
      else ecrire(CLE_IGNOREE, String(Date.now()));
    } catch {
      /* le navigateur a refusé d'ouvrir la fenêtre */
    }
    evenement.current = null;
    setFerme(true);
  }

  // Pas pendant qu'on écrit un crédit
  if (!mode || ferme || chemin === "/nouveau") return null;

  return (
    <div className="installer">
      <section className="installer__carte" aria-label="Installer l’application">
        <div className="installer__haut">
          <span className="installer__icone">
            <LogoCahier />
          </span>
          <div>
            <p className="installer__titre">Installer Cahier</p>
            <p className="installer__texte">Ouvrez-le comme une application, même sans internet.</p>
          </div>
        </div>

        {mode === "natif" && (
          <div className="installer__actions">
            <button type="button" className="btn" onClick={() => void installer()}>
              Installer
            </button>
            <button type="button" className="btn btn--contour" onClick={plusTard}>
              Plus tard
            </button>
          </div>
        )}

        {mode === "ios" && (
          <>
            <p className="installer__guide">
              Appuyez sur <IconePartager /> en bas de l’écran, puis sur <strong>« Sur l’écran d’accueil »</strong>.
            </p>
            <button type="button" className="btn btn--contour" onClick={plusTard}>
              J’ai compris
            </button>
          </>
        )}

        {mode === "manuel" && (
          <>
            <p className="installer__guide">
              Appuyez sur <strong>⋮</strong> en haut à droite du navigateur, puis sur{" "}
              <strong>« Installer l’application »</strong> ou <strong>« Ajouter à l’écran d’accueil »</strong>.
            </p>
            <button type="button" className="btn btn--contour" onClick={plusTard}>
              J’ai compris
            </button>
          </>
        )}
      </section>
    </div>
  );
}