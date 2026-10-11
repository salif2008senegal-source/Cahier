"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  aujourdhuiISO,
  dateLongue,
  formatNombre,
  jourDans,
  mettreEnForme,
  vibrer,
} from "@/src/lib/format";
import { clientsConnus, scoreTexte, simplifierTexte } from "@/src/lib/recherche";
import type { Dette, SaisieDette } from "@/src/lib/types";
import { useCahier } from "./FournisseurCahier";
import { IconeCocheSimple, IconeRetour } from "./Icones.tsx";

const ARTICLES = ["Riz", "Sucre", "Huile", "Pain", "Lait", "Savon", "Oignon", "Café"];
const MONTANTS = [500, 1000, 2000, 5000, 10000];
const RACCOURCIS = [
  { libelle: "Demain", jours: 1 },
  { libelle: "3 jours", jours: 3 },
  { libelle: "1 semaine", jours: 7 },
  { libelle: "2 semaines", jours: 14 },
  { libelle: "1 mois", jours: 30 },
];

export default function FormulaireDette() {
  const parametres = useSearchParams();
  const idModif = parametres?.get("id") ?? null;
  const { dettes, pret } = useCahier();

  if (idModif && !pret) {
    return (
      <div className="page page--sans-barre">
        <div className="liste" aria-hidden="true">
          <div className="squelette" />
        </div>
      </div>
    );
  }

  const existante = idModif ? dettes.find((d) => d.id === idModif) ?? null : null;

  if (idModif && !existante) {
    return (
      <div className="page page--sans-barre">
        <div className="vide">
          <h2>Ce crédit n’existe plus</h2>
          <p>Il a peut-être été supprimé.</p>
          <Link href="/" className="btn">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    );
  }

  return <Formulaire key={existante?.id ?? "nouveau"} existante={existante} />;
}

function Formulaire({ existante }: { existante: Dette | null }) {
  const { dettes, ajouterDette, modifierDette, afficherToast, setRecherche } = useCahier();
  const routeur = useRouter();

  const nomRef = useRef<HTMLInputElement>(null);
  const articleRef = useRef<HTMLInputElement>(null);
  const montantRef = useRef<HTMLInputElement>(null);

  const [nom, setNom] = useState(existante?.nom_client ?? "");
  const [article, setArticle] = useState(existante?.article ?? "");
  const [montant, setMontant] = useState(existante ? String(existante.montant_cfa) : "");
  const [date, setDate] = useState(existante?.date_remboursement ?? "");
  const [erreur, setErreur] = useState<{ texte: string; id: number } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Nouveau crédit : le clavier s'ouvre directement sur le nom
  useEffect(() => {
    if (!existante) nomRef.current?.focus();
  }, [existante]);

  const clients = useMemo(() => clientsConnus(dettes), [dettes]);
  const cleSaisie = simplifierTexte(nom);
  const clientConnu = clients.find((c) => c.cle === cleSaisie);

  // « Mamdou » propose « Mamadou » : évite les doublons
  const suggestions = useMemo(() => {
    if (!cleSaisie) return clients.slice(0, 6);
    return clients
      .map((c) => ({ c, score: scoreTexte(cleSaisie, c.cle) }))
      .filter((x) => x.score >= 0.5 && x.c.cle !== cleSaisie)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.c);
  }, [clients, cleSaisie]);

  function signaler(texte: string, cible: "nom" | "article" | "montant") {
    setErreur({ texte, id: Date.now() });
    const champ = cible === "nom" ? nomRef : cible === "article" ? articleRef : montantRef;
    champ.current?.focus();
  }

  function ajouterArticle(mot: string) {
    setArticle((actuel) => {
      if (actuel.toLowerCase().includes(mot.toLowerCase())) return actuel;
      return actuel.trim() ? `${actuel.trim()}, ${mot}` : mot;
    });
    setErreur(null);
  }

  function enregistrer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (envoi) return;

    const valeur = Number(montant);
    if (!nom.trim()) return signaler("Écrivez le nom du client", "nom");
    if (!article.trim()) return signaler("Écrivez ce qu’il a emprunté", "article");
    if (!valeur) return signaler("Écrivez ce qu’il doit", "montant");

    const saisie: SaisieDette = {
      nom_client: clientConnu ? clientConnu.nom : mettreEnForme(nom),
      article: article.trim(),
      montant_cfa: valeur,
      date_remboursement: date || null,
    };

    setEnvoi(true);
    if (existante) {
      modifierDette(existante.id, saisie);
      afficherToast("Crédit modifié");
    } else {
      ajouterDette(saisie);
      afficherToast("Crédit enregistré");
    }
    vibrer(30);
    setRecherche("");
    routeur.push("/");
  }

  return (
    <div className="page page--sans-barre">
      <header className="entete entete--simple">
        <Link href="/" className="btn-retour" aria-label="Retour à l’accueil">
          <IconeRetour taille={22} />
        </Link>
        <h1>{existante ? "Modifier ce crédit" : "Nouveau crédit"}</h1>
      </header>

      <form className="form" onSubmit={enregistrer} noValidate>
        <div className="groupe">
          <label htmlFor="nom" className="etiquette-champ">
            Nom du client
          </label>
          <input
            id="nom"
            ref={nomRef}
            className="champ"
            type="text"
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="next"
            maxLength={60}
            placeholder="Ex : Mamadou Diop"
            value={nom}
            onChange={(e) => {
              setNom(e.target.value);
              setErreur(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                articleRef.current?.focus();
              }
            }}
          />
          {clientConnu && <p className="mini-titre">Ce client est déjà dans le cahier</p>}
          {suggestions.length > 0 && (
            <>
              <p className="mini-titre">{cleSaisie ? "Vous voulez dire ?" : "Clients récents"}</p>
              <div className="puces puces--libre">
                {suggestions.map((c) => (
                  <button
                    key={c.cle}
                    type="button"
                    className="puce"
                    onClick={() => {
                      setNom(c.nom);
                      setErreur(null);
                    }}
                  >
                    {c.nom}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="groupe">
          <label htmlFor="article" className="etiquette-champ">
            Ce qu’il a emprunté
          </label>
          <input
            id="article"
            ref={articleRef}
            className="champ"
            type="text"
            autoComplete="off"
            enterKeyHint="next"
            maxLength={120}
            placeholder="Ex : 2 sacs de riz"
            value={article}
            onChange={(e) => {
              setArticle(e.target.value);
              setErreur(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                montantRef.current?.focus();
              }
            }}
          />
          <div className="puces puces--libre">
            {ARTICLES.map((mot) => (
              <button key={mot} type="button" className="puce" onClick={() => ajouterArticle(mot)}>
                {mot}
              </button>
            ))}
          </div>
        </div>

        <div className="groupe">
          <label htmlFor="montant" className="etiquette-champ">
            Ce qu’il doit
          </label>
          <div className="champ-montant">
            <input
              id="montant"
              ref={montantRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              enterKeyHint="done"
              placeholder="0"
              value={montant ? formatNombre(Number(montant)) : ""}
              onChange={(e) => {
                setMontant(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9));
                setErreur(null);
              }}
            />
            <span>F CFA</span>
          </div>
          <div className="puces puces--libre">
            {MONTANTS.map((m) => (
              <button
                key={m}
                type="button"
                className="puce"
                onClick={() => {
                  setMontant(String(m));
                  setErreur(null);
                }}
              >
                {formatNombre(m)}
              </button>
            ))}
          </div>
        </div>

        <div className="groupe">
          <label htmlFor="date" className="etiquette-champ">
            Date de remboursement <small>(facultatif)</small>
          </label>
          <div className="puces puces--libre">
            {RACCOURCIS.map((r) => (
              <button
                key={r.jours}
                type="button"
                className="puce"
                aria-pressed={date === jourDans(r.jours)}
                onClick={() => setDate(jourDans(r.jours))}
              >
                {r.libelle}
              </button>
            ))}
          </div>
          <input
            id="date"
            className="champ"
            type="date"
            min={aujourdhuiISO()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <p className="date-resume">
            {date ? (
              <>
                <span>
                  Il doit rendre le <strong>{dateLongue(date)}</strong>
                </span>
                <button type="button" className="lien" onClick={() => setDate("")}>
                  Retirer
                </button>
              </>
            ) : (
              <span>Pas de date. Vous pouvez laisser vide.</span>
            )}
          </p>
        </div>

        {erreur && (
          <p key={erreur.id} className="erreur-form" role="alert">
            {erreur.texte}
          </p>
        )}

        <div className="barre-enregistrer">
          <button type="submit" className="btn" disabled={envoi}>
            <IconeCocheSimple taille={22} />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}