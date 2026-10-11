"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "./FournisseurAuth";
import { LogoCahier } from "./Icones.tsx";

function grouper(chiffres: string): string {
  return [chiffres.slice(0, 2), chiffres.slice(2, 5), chiffres.slice(5, 7), chiffres.slice(7, 9)]
    .filter(Boolean)
    .join(" ");
}

export default function EcranConnexion() {
  const { inscrire } = useAuth();

  const telRef = useRef<HTMLInputElement>(null);
  const nomRef = useRef<HTMLInputElement>(null);
  const [chiffres, setChiffres] = useState("");
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  // Le pavé numérique s'ouvre tout de suite sur le numéro
  useEffect(() => {
    telRef.current?.focus();
  }, []);

  function commencer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (chiffres.length !== 9) {
      setErreur("Écrivez votre numéro WhatsApp (9 chiffres).");
      telRef.current?.focus();
      return;
    }
    if (nom.trim().length < 2) {
      setErreur("Écrivez votre nom.");
      nomRef.current?.focus();
      return;
    }
    inscrire(nom, chiffres);
  }

  return (
    <div className="connexion">
      <div className="connexion__hero">
        <div className="connexion__logo">
          <LogoCahier />
        </div>
        <h1>Cahier</h1>
        <p>Vos crédits clients, simples et sûrs.</p>
      </div>

      <section className="connexion__carte">
        <form onSubmit={commencer} style={{ display: "grid", gap: 18 }} noValidate>
          <h2>Bienvenue</h2>
          <p className="texte-aide">Écrivez votre numéro et votre nom. Cahier se souviendra de vous.</p>

          <div className="groupe">
            <label htmlFor="telephone" className="etiquette-champ">
              Votre numéro WhatsApp
            </label>
            <div className="telephone">
              <span className="telephone__prefixe">+221</span>
              <input
                id="telephone"
                ref={telRef}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                enterKeyHint="next"
                placeholder="77 123 45 67"
                value={grouper(chiffres)}
                onChange={(e) => {
                  let saisie = e.target.value.replace(/\D/g, "");
                  if (saisie.startsWith("221") && saisie.length > 9) saisie = saisie.slice(3);
                  setChiffres(saisie.slice(0, 9));
                  setErreur(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    nomRef.current?.focus();
                  }
                }}
              />
            </div>
          </div>

          <div className="groupe">
            <label htmlFor="nom" className="etiquette-champ">
              Votre nom
            </label>
            <input
              id="nom"
              ref={nomRef}
              className="champ"
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="done"
              maxLength={60}
              placeholder="Ex : Awa Ndiaye"
              value={nom}
              onChange={(e) => {
                setNom(e.target.value);
                setErreur(null);
              }}
            />
          </div>

          {erreur && (
            <p className="erreur-form" role="alert">
              {erreur}
            </p>
          )}

          <button type="submit" className="btn">
            Commencer
          </button>
        </form>
      </section>
    </div>
  );
}