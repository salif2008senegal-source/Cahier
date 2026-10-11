"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./FournisseurAuth";

// Personne d'enregistré : direction l'écran de bienvenue. Déjà enregistré : on n'y retourne pas.
export default function GardeAcces() {
  const { etat } = useAuth();
  const chemin = usePathname() ?? "/";
  const routeur = useRouter();

  useEffect(() => {
    if (etat === "chargement") return;
    if (etat === "dehors" && chemin !== "/connexion") routeur.replace("/connexion");
    if (etat === "dedans" && chemin === "/connexion") routeur.replace("/");
  }, [etat, chemin, routeur]);

  return null;
}