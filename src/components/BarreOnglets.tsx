"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { statutEcheance } from "@/src/lib/format";
import { useAuth } from "./FournisseurAuth";
import { useCahier } from "./FournisseurCahier";
import { IconeCoche, IconeMaison, IconePlus } from "./Icones.tsx";

const SANS_BARRE = ["/nouveau", "/connexion"];

export default function BarreOnglets() {
  const chemin = usePathname() ?? "/";
  const { etat } = useAuth();
  const { dettes } = useCahier();

  const enRetard = useMemo(() => dettes.filter((d) => statutEcheance(d) === "retard").length, [dettes]);

  if (etat !== "dedans" || SANS_BARRE.some((p) => chemin === p || chemin.startsWith(`${p}/`))) return null;

  const surAccueil = chemin === "/";
  const surRegle = chemin === "/regle" || chemin.startsWith("/regle/");

  return (
    <div className="barre-bas">
      <div className="barre-bas__interne">
        <Link href="/nouveau" className="fab" aria-label="Ajouter un crédit (bor)">
          <IconePlus taille={24} />
          <span>Bor</span>
        </Link>

        <nav className="onglets" aria-label="Navigation principale">
          <Link
            href="/"
            className={`onglet${surAccueil ? " onglet--actif" : ""}`}
            aria-current={surAccueil ? "page" : undefined}
          >
            <span className="onglet__icone">
              <IconeMaison taille={24} />
              {enRetard > 0 && <span className="onglet__badge">{enRetard}</span>}
            </span>
            Accueil
          </Link>
          <Link
            href="/regle"
            className={`onglet${surRegle ? " onglet--actif" : ""}`}
            aria-current={surRegle ? "page" : undefined}
          >
            <span className="onglet__icone">
              <IconeCoche taille={24} />
            </span>
            Réglé
          </Link>
        </nav>
      </div>
    </div>
  );
}