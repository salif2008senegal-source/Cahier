"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { nouvelIdentifiant } from "@/src/lib/format";
import type { Profil } from "@/src/lib/types";

type Etat = "chargement" | "dehors" | "dedans";

type ContexteAuth = {
  etat: Etat;
  profil: Profil | null;
  inscrire: (nom: string, chiffres: string) => void;
};

const Contexte = createContext<ContexteAuth | null>(null);

const CLE_PROFIL = "cahier:profil";
const EVENEMENT = "cahier:profil-change";

// Copie en mémoire si le téléphone refuse d'écrire (navigation privée)
let secours: string | null = null;

export function useAuth(): ContexteAuth {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error("useAuth doit être utilisé dans <FournisseurAuth>");
  return contexte;
}

function lireBrut(): string | null {
  try {
    return localStorage.getItem(CLE_PROFIL) ?? secours;
  } catch {
    return secours;
  }
}

// Côté serveur on ne sait pas encore : "chargement"
function lireBrutServeur(): string | null | undefined {
  return undefined;
}

function sAbonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", rappel);
  };
}

function analyser(brut: string): Profil | null {
  try {
    const p = JSON.parse(brut) as Partial<Profil>;
    if (p && typeof p.id === "string" && typeof p.nom === "string") {
      return { id: p.id, nom: p.nom, telephone: typeof p.telephone === "string" ? p.telephone : "" };
    }
    return null;
  } catch {
    return null;
  }
}

export function FournisseurAuth({ children }: { children: ReactNode }) {
  // L'application se souvient de la personne (marche aussi hors-ligne)
  const brut = useSyncExternalStore<string | null | undefined>(sAbonner, lireBrut, lireBrutServeur);
  const profil = useMemo(() => (brut ? analyser(brut) : null), [brut]);
  const etat: Etat = brut === undefined ? "chargement" : profil ? "dedans" : "dehors";

  const inscrire = useCallback((nom: string, chiffres: string) => {
    const nouveau: Profil = {
      id: nouvelIdentifiant(),
      nom: nom.trim().replace(/\s+/g, " "),
      telephone: `+221${chiffres}`,
    };
    const texte = JSON.stringify(nouveau);
    secours = texte;
    try {
      localStorage.setItem(CLE_PROFIL, texte);
    } catch {
      /* stockage indisponible : valable pour cette session seulement */
    }
    window.dispatchEvent(new Event(EVENEMENT));
  }, []);

  const valeur = useMemo<ContexteAuth>(() => ({ etat, profil, inscrire }), [etat, profil, inscrire]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}