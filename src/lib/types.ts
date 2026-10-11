export type Dette = {
  id: string;
  nom_client: string;
  article: string; // ce qu'il a emprunté
  montant_cfa: number; // ce qu'il doit
  date_remboursement: string | null; // "2026-10-15", facultative
  est_regle: boolean; // true = barrée, rangée dans Réglé
  regle_le: string | null;
  est_supprime: boolean;
  cree_le: string;
  modifie_le: string;
  a_synchroniser: boolean; // écrite sur le téléphone, pas encore envoyée
};

export type SaisieDette = {
  nom_client: string;
  article: string;
  montant_cfa: number;
  date_remboursement: string | null;
};

export type Profil = {
  id: string; // identifiant gardé sur le téléphone
  nom: string;
  telephone: string; // "+221771234567"
};