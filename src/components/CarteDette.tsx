"use client";

import {
  couleurClient,
  dateCourte,
  formatMontant,
  initiale,
  libelleEcheance,
  statutEcheance,
} from "@/src/lib/format";
import { simplifierTexte } from "@/src/lib/recherche";
import type { Dette } from "@/src/lib/types";
import { IconeCrayon, IconeCroix } from "./Icones.tsx";

type Props = {
  dette: Dette;
  mode: "cours" | "regle";
  barree: boolean;
  onOuvrir: () => void;
  onModifier: () => void;
  onSupprimer: () => void;
};

export default function CarteDette({ dette, mode, barree, onOuvrir, onModifier, onSupprimer }: Props) {
  const regle = mode === "regle";
  const statut = regle ? "regle" : statutEcheance(dette);

  let etiquette = "Sans date";
  if (regle) etiquette = dette.regle_le ? `Réglé le ${dateCourte(dette.regle_le)}` : "Réglé";
  else if (dette.date_remboursement) etiquette = libelleEcheance(dette.date_remboursement);

  return (
    <li className={`carte carte--${statut}${barree ? " carte--barree" : ""}`}>
      <button
        type="button"
        className="carte__corps"
        onClick={onOuvrir}
        aria-label={`Ouvrir la fiche de ${dette.nom_client}`}
      >
        <span className="carte__tete">
          <span className="avatar" style={{ backgroundColor: couleurClient(simplifierTexte(dette.nom_client)) }}>
            {initiale(dette.nom_client)}
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span className="carte__nom">{dette.nom_client}</span>
            <span className="carte__article">{dette.article}</span>
          </span>
        </span>
        <span className="carte__pied">
          <span>
            <span className="carte__etiquette">{regle ? "Il a payé" : "Il doit"}</span>
            <span className="carte__montant">{formatMontant(dette.montant_cfa)}</span>
          </span>
          <span className={`badge badge--${statut}`}>{etiquette}</span>
        </span>
      </button>

      {!regle && (
        <div className="carte__actions">
          <button type="button" className="btn-mini" aria-label="Modifier" onClick={onModifier}>
            <IconeCrayon taille={18} />
          </button>
          <button type="button" className="btn-mini btn-mini--danger" aria-label="Supprimer" onClick={onSupprimer}>
            <IconeCroix taille={18} />
          </button>
        </div>
      )}
    </li>
  );
}