"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  ecartJours,
  formatMontant,
  pluriel,
  statutEcheance,
  trierParUrgence,
} from "@/src/lib/format";
import { chercher, indexer } from "@/src/lib/recherche";
import CarteDette from "./CarteDette";
import FeuilleDetail from "./FeuilleDetail";
import { useAuth } from "./FournisseurAuth";
import { useCahier } from "./FournisseurCahier";
import { IconeCloche, IconeCroix, IconeLoupe, IconePlus, IllustrationVide } from "./Icones.tsx";
import PastilleSynchro from "./PastilleSynchro";

type Mode = "cours" | "regle";
type Filtre = "tous" | "retard" | "semaine";

function Vide({ titre, texte, children }: { titre: string; texte: string; children?: ReactNode }) {
  return (
    <div className="vide">
      <IllustrationVide />
      <h2>{titre}</h2>
      <p>{texte}</p>
      {children}
    </div>
  );
}

export default function VueListe({ mode }: { mode: Mode }) {
  const { dettes, pret, recherche, setRecherche, marquerRegle, supprimer } = useCahier();
   const { etat, profil } = useAuth();
  const routeur = useRouter();

  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [enSortie, setEnSortie] = useState<string[]>([]);

  const regleMode = mode === "regle";
  const brute = recherche.trim();
  const prenom = profil ? profil.nom.split(" ")[0] : "";

  const liste = useMemo(() => dettes.filter((d) => d.est_regle === regleMode), [dettes, regleMode]);
  const autres = useMemo(() => dettes.filter((d) => d.est_regle !== regleMode), [dettes, regleMode]);

  const stats = useMemo(() => {
    let total = 0;
    let retard = 0;
    let aujourdhui = 0;
    let semaine = 0;
    let avecDate = 0;
    for (const d of liste) {
      total += d.montant_cfa;
      const statut = statutEcheance(d);
      if (statut === "retard") retard++;
      if (statut === "aujourdhui") aujourdhui++;
      const ecart = ecartJours(d.date_remboursement);
      if (!regleMode && ecart !== null) {
        avecDate++;
        if (ecart <= 7) semaine++;
      }
    }
    return { total, retard, aujourdhui, semaine, avecDate };
  }, [liste, regleMode]);

  const visibles = useMemo(() => {
    if (brute) return chercher(indexer(liste), brute).map((r) => r.dette);
    if (regleMode) return [...liste].sort((a, b) => (b.regle_le ?? "").localeCompare(a.regle_le ?? ""));
    const base =
      filtre === "tous"
        ? liste
        : liste.filter((d) => {
            const ecart = ecartJours(d.date_remboursement);
            return ecart !== null && (filtre === "retard" ? ecart < 0 : ecart <= 7);
          });
    return trierParUrgence(base);
  }, [liste, brute, filtre, regleMode]);

  const ailleurs = useMemo(() => (brute ? chercher(indexer(autres), brute).length : 0), [autres, brute]);
  const fiche = ouverte ? dettes.find((d) => d.id === ouverte) ?? null : null;

  function regler(id: string) {
    setOuverte(null);
    setEnSortie((courant) => [...courant, id]);
    window.setTimeout(() => {
      marquerRegle([id], true);
      setEnSortie((courant) => courant.filter((x) => x !== id));
    }, 550);
  }

  function rouvrir(id: string) {
    setOuverte(null);
    marquerRegle([id], false);
  }

  function retirer(id: string) {
    setOuverte(null);
    supprimer([id]);
  }

  function modifier(id: string) {
    setOuverte(null);
    routeur.push(`/nouveau?id=${encodeURIComponent(id)}`);
  }

  const chargement = !pret || etat !== "dedans";
  const videTotal = !chargement && liste.length === 0 && !brute;
  const videRecherche = !chargement && brute !== "" && visibles.length === 0;
  const videFiltre = !chargement && !brute && liste.length > 0 && visibles.length === 0;

  const urgents = stats.retard + stats.aujourdhui;
  const detailAlerte = [
    stats.retard > 0 ? `${stats.retard} en retard` : null,
    stats.aujourdhui > 0 ? `${stats.aujourdhui} pour aujourd’hui` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const filtres: { valeur: Filtre; libelle: string }[] = [
    { valeur: "tous", libelle: `Tous (${liste.length})` },
    { valeur: "retard", libelle: `En retard (${stats.retard})` },
    { valeur: "semaine", libelle: `Cette semaine (${stats.semaine})` },
  ];

  return (
    <div className="page">
      <header className="entete">
        <div className="entete__haut">
          <div>
            <p className="entete__salut">
              {regleMode ? "Crédits déjà payés" : prenom ? `Bonjour ${prenom}` : "Bonjour"}
            </p>
            <h1 className="entete__titre">{regleMode ? "Réglé" : "Cahier"}</h1>
          </div>
          <PastilleSynchro />
        </div>

        <div className="recherche" role="search">
          <IconeLoupe taille={22} />
          <label htmlFor="champ-recherche" className="sr-seul">
            Chercher un nom, un article ou un montant
          </label>
          <input
            id="champ-recherche"
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Nom, article ou montant"
          />
          {recherche && (
            <button type="button" className="btn-rond" aria-label="Effacer la recherche" onClick={() => setRecherche("")}>
              <IconeCroix taille={18} />
            </button>
          )}
        </div>

        <div className="stats">
          <div className="stat">
            <p className="stat__label">{regleMode ? "Déjà encaissé" : "À récupérer"}</p>
            <p className="stat__valeur">{chargement ? "…" : formatMontant(stats.total)}</p>
          </div>
          {regleMode ? (
            <div className="stat">
              <p className="stat__label">Crédits réglés</p>
              <p className="stat__valeur">{chargement ? "…" : liste.length}</p>
            </div>
          ) : (
            <div className={`stat${stats.retard > 0 ? " stat--alerte" : ""}`}>
              <p className="stat__label">En retard</p>
              <p className="stat__valeur">{chargement ? "…" : stats.retard}</p>
            </div>
          )}
        </div>
      </header>

     

      {!regleMode && !brute && urgents > 0 && (
        <div className={`alerte${stats.retard > 0 ? " alerte--rouge" : ""}`}>
          <span className="alerte__icone">
            <IconeCloche taille={22} />
          </span>
          <div className="alerte__texte">
            <strong>{pluriel(urgents, "crédit")} à réclamer</strong>
            <span>{detailAlerte}</span>
          </div>
          <button
            type="button"
            className="alerte__btn"
            onClick={() => setFiltre(stats.retard > 0 ? "retard" : "semaine")}
          >
            Voir
          </button>
        </div>
      )}

      {!regleMode && !brute && stats.avecDate > 0 && (
        <div className="puces">
          {filtres.map((f) => (
            <button
              key={f.valeur}
              type="button"
              className="puce"
              aria-pressed={filtre === f.valeur}
              onClick={() => setFiltre(f.valeur)}
            >
              {f.libelle}
            </button>
          ))}
        </div>
      )}

      {chargement && (
        <div className="liste" aria-hidden="true">
          <div className="squelette" />
          <div className="squelette" />
          <div className="squelette" />
        </div>
      )}

      {videTotal && (
        <Vide
          titre={regleMode ? "Rien de réglé pour le moment" : "Aucun crédit en cours"}
          texte={
            regleMode
              ? "Quand un client paie, ouvrez sa fiche et appuyez sur Réglé."
              : "Appuyez sur Bor pour écrire le premier crédit."
          }
        >
          {!regleMode && (
            <Link href="/nouveau" className="btn">
              <IconePlus taille={22} />
              Ajouter un bor
            </Link>
          )}
        </Vide>
      )}

      {videRecherche && (
        <Vide titre={`Aucun résultat pour « ${brute} »`} texte="Essayez avec moins de lettres, ou un autre mot.">
          {ailleurs > 0 && (
            <Link href={regleMode ? "/" : "/regle"} className="btn btn--contour">
              Voir dans {regleMode ? "l’accueil" : "Réglé"} ({ailleurs})
            </Link>
          )}
        </Vide>
      )}

      {videFiltre && (
        <Vide titre="Rien dans ce filtre" texte="Aucun crédit ne correspond pour le moment.">
          <button type="button" className="btn btn--contour" onClick={() => setFiltre("tous")}>
            Tout voir
          </button>
        </Vide>
      )}

      {!chargement && visibles.length > 0 && (
        <ul className="liste">
          {visibles.map((dette) => (
            <CarteDette
              key={dette.id}
              dette={dette}
              mode={mode}
              barree={enSortie.includes(dette.id)}
              onOuvrir={() => setOuverte(dette.id)}
              onModifier={() => modifier(dette.id)}
              onSupprimer={() => retirer(dette.id)}
            />
          ))}
        </ul>
      )}

      {fiche && (
        <FeuilleDetail
          dette={fiche}
          onFermer={() => setOuverte(null)}
          onRegler={() => regler(fiche.id)}
          onRouvrir={() => rouvrir(fiche.id)}
          onModifier={() => modifier(fiche.id)}
          onSupprimer={() => retirer(fiche.id)}
        />
      )}
    </div>
  );
}