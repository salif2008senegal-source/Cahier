import type { Dette } from "./types";

const INSECABLE = "\u00a0";
const JOUR_MS = 86400000;

export function formatNombre(valeur: number): string {
  return new Intl.NumberFormat("fr-FR").format(valeur).replace(/\s/g, INSECABLE);
}

export function formatMontant(valeur: number): string {
  return `${formatNombre(valeur)}${INSECABLE}F`;
}

export function pluriel(nombre: number, mot: string): string {
  return `${nombre}${INSECABLE}${mot}${nombre > 1 ? "s" : ""}`;
}

/* ---------- Dates (jours au format "2026-10-15", heure locale du téléphone) ---------- */

function minuit(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function enDateLocale(jour: string): Date {
  const [annee, mois, j] = jour.split("-").map(Number);
  return new Date(annee, mois - 1, j);
}

export function versJourISO(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

export function aujourdhuiISO(): string {
  return versJourISO(new Date());
}

export function jourDans(jours: number): string {
  const date = minuit(new Date());
  date.setDate(date.getDate() + jours);
  return versJourISO(date);
}

// Nombre de jours entre aujourd'hui et la date (négatif = en retard)
export function ecartJours(jour: string | null): number | null {
  if (!jour) return null;
  return Math.round((enDateLocale(jour).getTime() - minuit(new Date()).getTime()) / JOUR_MS);
}

export type Statut = "aucune" | "retard" | "aujourdhui" | "bientot" | "plus_tard";

export function statutEcheance(dette: Dette): Statut {
  if (dette.est_regle) return "aucune";
  const ecart = ecartJours(dette.date_remboursement);
  if (ecart === null) return "aucune";
  if (ecart < 0) return "retard";
  if (ecart === 0) return "aujourdhui";
  if (ecart <= 3) return "bientot";
  return "plus_tard";
}

export function libelleEcheance(jour: string): string {
  const ecart = ecartJours(jour);
  if (ecart === null) return "";
  if (ecart < 0) return `En retard de ${pluriel(-ecart, "jour")}`;
  if (ecart === 0) return "Aujourd’hui";
  if (ecart === 1) return "Demain";
  if (ecart <= 6) return `Dans ${ecart} jours`;
  return `Le ${enDateLocale(jour).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

export function dateLongue(jour: string): string {
  return enDateLocale(jour).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Les plus urgents d'abord : en retard, aujourd'hui, bientôt, puis ceux sans date
export function trierParUrgence(dettes: Dette[]): Dette[] {
  return [...dettes].sort((a, b) => {
    const ea = ecartJours(a.date_remboursement);
    const eb = ecartJours(b.date_remboursement);
    if (ea !== null && eb !== null && ea !== eb) return ea - eb;
    if (ea !== null && eb === null) return -1;
    if (ea === null && eb !== null) return 1;
    return b.cree_le.localeCompare(a.cree_le);
  });
}

/* ---------- Divers ---------- */

// "mamadou DIOP" devient "Mamadou Diop"
export function mettreEnForme(nom: string): string {
  return nom
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s'’-])([a-zà-ÿ])/g, (_texte, debut: string, lettre: string) => debut + lettre.toUpperCase());
}

export function initiale(nom: string): string {
  return nom.trim().charAt(0).toUpperCase() || "?";
}

const PALETTE = ["#1f63e6", "#0e8aa8", "#6d4fe0", "#d1357f", "#d9650f", "#139a58", "#0d8f84", "#4350d6"];

export function couleurClient(cle: string): string {
  let h = 0;
  for (let i = 0; i < cle.length; i++) h = (h * 31 + cle.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function vibrer(ms: number): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}

export function nouvelIdentifiant(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}