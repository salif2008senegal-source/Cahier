"use client";

import { useEffect } from "react";
import {
  couleurClient,
  dateCourte,
  dateLongue,
  formatMontant,
  initiale,
  libelleEcheance,
  statutEcheance,
} from "@/src/lib/format";
import { simplifierTexte } from "@/src/lib/recherche";
import type { Dette } from "@/src/lib/types";
import { IconeCocheSimple, IconeCrayon, IconeCroix, IconePoubelle } from "./Icones.tsx";

type Props = {
  dette: Dette;
  onFermer: () => void;
  onRegler: () => void;
  onRouvrir: () => void;
  onModifier: () => void;
  onSupprimer: () => void;
};

export default function FeuilleDetail({ dette, onFermer, onRegler, onRouvrir, onModifier, onSupprimer }: Props) {
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", surTouche);
    };
  }, [onFermer]);

  const regle = dette.est_regle;
  const statut = statutEcheance(dette);

  return (
    <div className="voile" onClick={onFermer}>
      <div
        className="feuille"
        role="dialog"
        aria-modal="true"
        aria-label={`Fiche de ${dette.nom_client}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="feuille__poignee" />

        <div className="feuille__tete">
          <span
            className="avatar avatar--grand"
            style={{ backgroundColor: couleurClient(simplifierTexte(dette.nom_client)) }}
          >
            {initiale(dette.nom_client)}
          </span>
          <div>
            <h2>{dette.nom_client}</h2>
            <p>{regle ? "A tout payé" : "Doit encore"}</p>
          </div>
          <button type="button" className="btn-mini" aria-label="Fermer" onClick={onFermer}>
            <IconeCroix taille={18} />
          </button>
        </div>

        <p className={`feuille__montant${regle ? " barre-texte" : ""}`}>{formatMontant(dette.montant_cfa)}</p>

        <dl className="infos">
          <div>
            <dt>Il a pris</dt>
            <dd>{dette.article}</dd>
          </div>
          <div>
            <dt>Ajouté le</dt>
            <dd>{dateCourte(dette.cree_le)}</dd>
          </div>
          <div>
            <dt>À rembourser</dt>
            <dd>
              {dette.date_remboursement ? (
                <>
                  {dateLongue(dette.date_remboursement)}
                  {!regle && (
                    <>
                      <br />
                      <span className={`badge badge--${statut}`}>{libelleEcheance(dette.date_remboursement)}</span>
                    </>
                  )}
                </>
              ) : (
                "Pas de date"
              )}
            </dd>
          </div>
          {regle && dette.regle_le && (
            <div>
              <dt>Réglé le</dt>
              <dd>{dateCourte(dette.regle_le)}</dd>
            </div>
          )}
        </dl>

        <div className="feuille__actions">
          {regle ? (
            <button type="button" className="btn btn--contour" onClick={onRouvrir}>
              Remettre dans l’accueil
            </button>
          ) : (
            <button type="button" className="btn btn--vert" onClick={onRegler}>
              <IconeCocheSimple taille={22} />
              C’est réglé
            </button>
          )}
          <div className="deux">
            {!regle && (
              <button type="button" className="btn btn--contour" onClick={onModifier}>
                <IconeCrayon taille={18} />
                Modifier
              </button>
            )}
            <button type="button" className="btn btn--contour btn--danger" onClick={onSupprimer}>
              <IconePoubelle taille={18} />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}