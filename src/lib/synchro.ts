import { obtenirSupabase } from "./supabase";
import type { Dette, Profil } from "./types";

export type LigneDistante = {
  id: string;
  nom_client: string;
  article: string;
  montant_cfa: number;
  date_remboursement: string | null;
  est_regle: boolean;
  regle_le: string | null;
  est_supprime: boolean;
  cree_le: string;
  modifie_le: string;
};

export type ResultatSynchro = { envoyees: Dette[]; recues: Dette[] };

const TAILLE_PAGE = 1000;
const MARGE_MS = 24 * 60 * 60 * 1000;

function enISO(valeur: string): string {
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? valeur : date.toISOString();
}

function versDette(ligne: LigneDistante): Dette {
  return {
    id: ligne.id,
    nom_client: ligne.nom_client,
    article: ligne.article,
    montant_cfa: ligne.montant_cfa,
    date_remboursement: ligne.date_remboursement,
    est_regle: ligne.est_regle,
    regle_le: ligne.regle_le ? enISO(ligne.regle_le) : null,
    est_supprime: ligne.est_supprime,
    cree_le: enISO(ligne.cree_le),
    modifie_le: enISO(ligne.modifie_le),
    a_synchroniser: false,
  };
}

function versLigne(dette: Dette): LigneDistante {
  return {
    id: dette.id,
    nom_client: dette.nom_client,
    article: dette.article,
    montant_cfa: dette.montant_cfa,
    date_remboursement: dette.date_remboursement,
    est_regle: dette.est_regle,
    regle_le: dette.regle_le,
    est_supprime: dette.est_supprime,
    cree_le: dette.cree_le,
    modifie_le: dette.modifie_le,
  };
}

// On ne redemande que les lignes récentes (économise les données mobiles)
export function calculerDepuis(dettes: Dette[]): string | null {
  let dernier = "";
  for (const dette of dettes) {
    if (!dette.a_synchroniser && dette.modifie_le > dernier) dernier = dette.modifie_le;
  }
  if (!dernier) return null;
  return new Date(new Date(dernier).getTime() - MARGE_MS).toISOString();
}

export async function synchroniserAvecSupabase(
  enAttente: Dette[],
  depuis: string | null,
  profil: Profil
): Promise<ResultatSynchro | null> {
  const supabase = obtenirSupabase();
  if (!supabase) return null;

  // Compte invisible : un cahier privé par téléphone, sans mot de passe
  const { data: donneesSession, error: erreurSession } = await supabase.auth.getSession();
  if (erreurSession) throw new Error(erreurSession.message);
  let session = donneesSession.session;
  if (!session) {
    const { data: ouverte, error } = await supabase.auth.signInAnonymously();
    if (error || !ouverte.session) throw new Error(error?.message ?? "Connexion impossible");
    session = ouverte.session;
  }

  // 1. Nom + numéro du boutiquier (sert aussi à voir qui utilise l'application)
  const { error: erreurProfil } = await supabase.from("profils").upsert(
    {
      id: session.user.id,
      nom: profil.nom,
      telephone: profil.telephone,
      derniere_activite: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (erreurProfil) throw new Error(erreurProfil.message);

  // 2. Envoyer ce qui a été écrit hors-ligne
  for (let i = 0; i < enAttente.length; i += 200) {
    const lot = enAttente.slice(i, i + 200).map(versLigne);
    const { error } = await supabase.from("dettes").upsert(lot, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  // 3. Récupérer les nouveautés
  const recues: Dette[] = [];
  for (let debut = 0; ; debut += TAILLE_PAGE) {
    let requete = supabase.from("dettes").select("*");
    if (depuis) requete = requete.gte("modifie_le", depuis);
    const { data, error } = await requete
      .order("modifie_le", { ascending: true })
      .order("id", { ascending: true })
      .range(debut, debut + TAILLE_PAGE - 1);
    if (error) throw new Error(error.message);
    const lignes = (data as LigneDistante[] | null) ?? [];
    lignes.forEach((ligne) => recues.push(versDette(ligne)));
    if (lignes.length < TAILLE_PAGE) break;
  }

  return { envoyees: enAttente, recues };
}