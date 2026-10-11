"use client";

import { useCahier } from "./FournisseurCahier";

export default function PastilleSynchro() {
  const { pret, enLigne, synchroActive, synchroEnCours, erreurSynchro, enAttente, synchroniser } = useCahier();

  let texte = "À jour";
  let variante = "";

  if (!pret) {
    texte = "Ouverture";
    variante = "charge";
  } else if (!synchroActive) {
    texte = "Sur ce téléphone";
    variante = "local";
  } else if (!enLigne) {
    texte = enAttente > 0 ? `Hors ligne, ${enAttente} à envoyer` : "Hors ligne";
    variante = "hors";
  } else if (synchroEnCours) {
    texte = "Envoi en cours";
    variante = "charge";
  } else if (erreurSynchro) {
    texte = "Réessayer";
    variante = "erreur";
  } else if (enAttente > 0) {
    texte = `${enAttente} à envoyer`;
    variante = "hors";
  }

  return (
    <button
      type="button"
      className={`pastille${variante ? ` pastille--${variante}` : ""}`}
      onClick={() => synchroniser()}
    >
      <span className="pastille__point" />
      {texte}
    </button>
  );
}