"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ecrireDettes, lireDettes } from "@/src/lib/base-locale";
import { nouvelIdentifiant, vibrer } from "@/src/lib/format";
import { supabaseConfigure } from "@/src/lib/supabase";
import { calculerDepuis, synchroniserAvecSupabase } from "@/src/lib/synchro";
import type { Dette, Profil, SaisieDette } from "@/src/lib/types";
import { useAuth } from "./FournisseurAuth";

type Toast = { id: number; texte: string; annuler?: () => void };

export type ContexteCahier = {
  dettes: Dette[]; // sans les lignes supprimées
  pret: boolean;
  enLigne: boolean;
  synchroActive: boolean;
  synchroEnCours: boolean;
  erreurSynchro: boolean;
  enAttente: number;
  recherche: string;
  setRecherche: (valeur: string) => void;
  toast: Toast | null;
  ajouterDette: (saisie: SaisieDette) => Dette;
  modifierDette: (id: string, saisie: SaisieDette) => void;
  marquerRegle: (ids: string[], estRegle: boolean) => void;
  supprimer: (ids: string[]) => void;
  afficherToast: (texte: string, annuler?: () => void) => void;
  fermerToast: () => void;
  synchroniser: () => void;
};

const Contexte = createContext<ContexteCahier | null>(null);

export function useCahier(): ContexteCahier {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error("useCahier doit être utilisé dans <FournisseurCahier>");
  return contexte;
}

function sAbonnerAuReseau(rappel: () => void) {
  window.addEventListener("online", rappel);
  window.addEventListener("offline", rappel);
  return () => {
    window.removeEventListener("online", rappel);
    window.removeEventListener("offline", rappel);
  };
}
function lireEtatReseau() {
  return navigator.onLine;
}
function lireEtatReseauServeur() {
  return true;
}

export function FournisseurCahier({ children }: { children: ReactNode }) {
  const { profil } = useAuth();
  return (
    <CahierInterne key={profil?.id ?? "aucun"} profil={profil}>
      {children}
    </CahierInterne>
  );
}

function CahierInterne({ profil, children }: { profil: Profil | null; children: ReactNode }) {
  const synchroActive = Boolean(profil && supabaseConfigure);

  const [toutes, setToutes] = useState<Dette[]>([]); // y compris les lignes supprimées
  const [pret, setPret] = useState(false);
  const [synchroEnCours, setSynchroEnCours] = useState(false);
  const [erreurSynchro, setErreurSynchro] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const toutesRef = useRef<Dette[]>([]);
  const synchroVerrou = useRef(false);
  const minuteurToast = useRef<number | undefined>(undefined);

  const enLigne = useSyncExternalStore(sAbonnerAuReseau, lireEtatReseau, lireEtatReseauServeur);

  // Applique des lignes modifiées : mémoire + écran + stockage du téléphone
  const appliquer = useCallback((changees: Dette[]) => {
    if (changees.length === 0) return;
    const parId = new Map<string, Dette>();
    toutesRef.current.forEach((d) => parId.set(d.id, d));
    changees.forEach((d) => parId.set(d.id, d));
    const suivantes = Array.from(parId.values());
    toutesRef.current = suivantes;
    setToutes(suivantes);
    ecrireDettes(changees).catch(() => {
      /* stockage local indisponible : on garde au moins la mémoire vive */
    });
  }, []);

  // Ouverture : on relit le cahier gardé sur le téléphone
  useEffect(() => {
    let annule = false;
    lireDettes()
      .then((locales) => {
        if (annule) return;
        const parId = new Map<string, Dette>();
        locales.forEach((d) => parId.set(d.id, d));
        toutesRef.current.forEach((d) => parId.set(d.id, d));
        const fusion = Array.from(parId.values());
        toutesRef.current = fusion;
        setToutes(fusion);
      })
      .catch(() => {
        /* première ouverture ou stockage indisponible */
      })
      .finally(() => {
        if (!annule) setPret(true);
      });
    return () => {
      annule = true;
    };
  }, []);

  const modifier = useCallback(
    (ids: string[], changement: Partial<Dette>) => {
      const maintenant = new Date().toISOString();
      const changees: Dette[] = [];
      ids.forEach((id) => {
        const actuelle = toutesRef.current.find((d) => d.id === id);
        if (actuelle) {
          changees.push({ ...actuelle, ...changement, modifie_le: maintenant, a_synchroniser: true });
        }
      });
      appliquer(changees);
    },
    [appliquer]
  );

  const fermerToast = useCallback(() => {
    window.clearTimeout(minuteurToast.current);
    setToast(null);
  }, []);

  const afficherToast = useCallback((texte: string, annuler?: () => void) => {
    window.clearTimeout(minuteurToast.current);
    setToast({ id: Date.now(), texte, annuler });
    minuteurToast.current = window.setTimeout(() => setToast(null), 6000);
  }, []);

  const ajouterDette = useCallback(
    (saisie: SaisieDette): Dette => {
      const maintenant = new Date().toISOString();
      const dette: Dette = {
        id: nouvelIdentifiant(),
        nom_client: saisie.nom_client.trim(),
        article: saisie.article.trim(),
        montant_cfa: Math.round(saisie.montant_cfa),
        date_remboursement: saisie.date_remboursement,
        est_regle: false,
        regle_le: null,
        est_supprime: false,
        cree_le: maintenant,
        modifie_le: maintenant,
        a_synchroniser: true,
      };
      appliquer([dette]);
      return dette;
    },
    [appliquer]
  );

  const modifierDette = useCallback(
    (id: string, saisie: SaisieDette) => {
      modifier([id], {
        nom_client: saisie.nom_client.trim(),
        article: saisie.article.trim(),
        montant_cfa: Math.round(saisie.montant_cfa),
        date_remboursement: saisie.date_remboursement,
      });
    },
    [modifier]
  );

  // Réglé = barré et rangé dans l'onglet Réglé (rien n'est supprimé). Annulable 6 secondes.
  const marquerRegle = useCallback(
    (ids: string[], estRegle: boolean) => {
      modifier(ids, { est_regle: estRegle, regle_le: estRegle ? new Date().toISOString() : null });
      vibrer(estRegle ? 30 : 15);
      afficherToast(estRegle ? "Barré et rangé dans Réglé" : "Remis dans l’accueil", () =>
        modifier(ids, { est_regle: !estRegle, regle_le: !estRegle ? new Date().toISOString() : null })
      );
    },
    [modifier, afficherToast]
  );

  const supprimer = useCallback(
    (ids: string[]) => {
      modifier(ids, { est_supprime: true });
      afficherToast("Crédit supprimé", () => modifier(ids, { est_supprime: false }));
    },
    [modifier, afficherToast]
  );

  const synchroniser = useCallback(async () => {
    if (!profil || !supabaseConfigure || synchroVerrou.current || !navigator.onLine) return;
    synchroVerrou.current = true;
    setSynchroEnCours(true);
    try {
      const enAttente = toutesRef.current.filter((d) => d.a_synchroniser);
      const resultat = await synchroniserAvecSupabase(enAttente, calculerDepuis(toutesRef.current), profil);
      if (!resultat) return;

      const parId = new Map<string, Dette>();
      toutesRef.current.forEach((d) => parId.set(d.id, d));
      const changees: Dette[] = [];

      // Ce qui vient d'être envoyé n'est plus "en attente" (sauf si modifié entre-temps)
      resultat.envoyees.forEach((envoyee) => {
        const courante = parId.get(envoyee.id);
        if (courante && courante.a_synchroniser && courante.modifie_le === envoyee.modifie_le) {
          const apres = { ...courante, a_synchroniser: false };
          parId.set(apres.id, apres);
          changees.push(apres);
        }
      });

      // Ce qui vient du serveur, sans écraser ce qui attend encore d'être envoyé
      resultat.recues.forEach((recue) => {
        const locale = parId.get(recue.id);
        if (locale && (locale.a_synchroniser || locale.modifie_le === recue.modifie_le)) return;
        parId.set(recue.id, recue);
        changees.push(recue);
      });

      appliquer(changees);
      setErreurSynchro(false);
    } catch (erreur) {
      console.error("Synchronisation impossible :", erreur);
      setErreurSynchro(true);
    } finally {
      synchroVerrou.current = false;
      setSynchroEnCours(false);
    }
  }, [appliquer, profil]);

  const dettes = useMemo(() => toutes.filter((d) => !d.est_supprime), [toutes]);
  const enAttente = useMemo(() => toutes.filter((d) => d.a_synchroniser).length, [toutes]);

  // Première synchronisation dès que le cahier est lu
  useEffect(() => {
    if (pret) void synchroniser();
  }, [pret, synchroniser]);

  // Dès qu'il y a quelque chose à envoyer et du réseau : on envoie, discrètement
  useEffect(() => {
    if (!pret || !enLigne || enAttente === 0) return;
    const minuteur = window.setTimeout(() => void synchroniser(), 800);
    return () => window.clearTimeout(minuteur);
  }, [pret, enLigne, enAttente, synchroniser]);

  // Retour du réseau, retour sur l'application, et petit rappel toutes les minutes
  useEffect(() => {
    const surRetour = () => void synchroniser();
    const surVisibilite = () => {
      if (document.visibilityState === "visible") void synchroniser();
    };
    window.addEventListener("online", surRetour);
    document.addEventListener("visibilitychange", surVisibilite);
    const intervalle = window.setInterval(surRetour, 60000);
    return () => {
      window.removeEventListener("online", surRetour);
      document.removeEventListener("visibilitychange", surVisibilite);
      window.clearInterval(intervalle);
    };
  }, [synchroniser]);

  const valeur = useMemo<ContexteCahier>(
    () => ({
      dettes,
      pret,
      enLigne,
      synchroActive,
      synchroEnCours,
      erreurSynchro,
      enAttente,
      recherche,
      setRecherche,
      toast,
      ajouterDette,
      modifierDette,
      marquerRegle,
      supprimer,
      afficherToast,
      fermerToast,
      synchroniser: () => void synchroniser(),
    }),
    [
      dettes,
      pret,
      enLigne,
      synchroActive,
      synchroEnCours,
      erreurSynchro,
      enAttente,
      recherche,
      toast,
      ajouterDette,
      modifierDette,
      marquerRegle,
      supprimer,
      afficherToast,
      fermerToast,
      synchroniser,
    ]
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}