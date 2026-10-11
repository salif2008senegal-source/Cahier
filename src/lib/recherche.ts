import type { Dette } from "./types";

export type EntreeIndex = { dette: Dette; texte: string };
export type Resultat = { dette: Dette; score: number };

// "Mouhamed", "Mohamed", "Muhamed" donnent tous "muamed"
export function simplifierTexte(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ou/g, "u")
    .replace(/o/g, "u")
    .replace(/y/g, "i")
    .replace(/k/g, "c")
    .replace(/w/g, "u")
    .replace(/h/g, "")
    .replace(/([a-z])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const cacheTrigrammes = new Map<string, Set<string>>();

function trigrammes(mot: string): Set<string> {
  const connu = cacheTrigrammes.get(mot);
  if (connu) return connu;
  const ensemble = new Set<string>();
  const rempli = `  ${mot} `;
  for (let i = 0; i < rempli.length - 2; i++) ensemble.add(rempli.slice(i, i + 3));
  cacheTrigrammes.set(mot, ensemble);
  return ensemble;
}

function similarite(a: string, b: string): number {
  const ta = trigrammes(a);
  const tb = trigrammes(b);
  let commun = 0;
  ta.forEach((t) => {
    if (tb.has(t)) commun++;
  });
  return commun / (ta.size + tb.size - commun);
}

// Les deux textes doivent déjà être passés dans simplifierTexte
export function scoreTexte(requete: string, texte: string): number {
  if (!requete) return 0;
  const motsDoc = texte.split(" ").filter(Boolean);
  const motsRequete = requete.split(" ").filter(Boolean);
  let total = 0;
  for (const m of motsRequete) {
    let meilleur = 0;
    for (const d of motsDoc) {
      if (d.startsWith(m)) meilleur = Math.max(meilleur, 0.9 + Math.min(m.length / d.length, 1) * 0.1);
      else if (m.length >= 3 && d.includes(m)) meilleur = Math.max(meilleur, 0.75);
      else meilleur = Math.max(meilleur, similarite(m, d));
    }
    if (meilleur < 0.35) return 0; // chaque mot tapé doit ressembler à quelque chose
    total += meilleur;
  }
  return total / motsRequete.length;
}

export function indexer(dettes: Dette[]): EntreeIndex[] {
  return dettes.map((dette) => ({
    dette,
    texte: `${simplifierTexte(`${dette.nom_client} ${dette.article}`)} ${dette.montant_cfa}`,
  }));
}

function comparer(a: Resultat, b: Resultat): number {
  const ecart = Math.round(b.score * 10) - Math.round(a.score * 10);
  if (ecart !== 0) return ecart;
  return b.dette.cree_le.localeCompare(a.dette.cree_le);
}

// Un nom, un article, un montant, ou plusieurs à la fois : "mamad riz", "1000"
export function chercher(index: EntreeIndex[], requeteBrute: string): Resultat[] {
  const brute = requeteBrute.trim();
  if (!brute) return [];

  const chiffres = brute.replace(/\s/g, "");
  const estMontant = /^\d+$/.test(chiffres);
  const requete = simplifierTexte(brute);
  const resultats: Resultat[] = [];

  for (const entree of index) {
    let score = 0;
    if (estMontant) {
      const montant = String(entree.dette.montant_cfa);
      if (montant === chiffres) score = 1;
      else if (montant.startsWith(chiffres)) score = 0.8;
      else if (montant.includes(chiffres)) score = 0.6;
    } else {
      score = scoreTexte(requete, entree.texte);
    }
    if (score > 0) resultats.push({ dette: entree.dette, score });
  }
  return resultats.sort(comparer);
}

// Les clients déjà dans le cahier, le plus récent d'abord (sans doublons)
export function clientsConnus(dettes: Dette[]): { cle: string; nom: string }[] {
  const recentes = [...dettes].sort((a, b) => b.cree_le.localeCompare(a.cree_le));
  const vus = new Set<string>();
  const liste: { cle: string; nom: string }[] = [];
  for (const dette of recentes) {
    const cle = simplifierTexte(dette.nom_client);
    if (!vus.has(cle)) {
      vus.add(cle);
      liste.push({ cle, nom: dette.nom_client });
    }
  }
  return liste;
}