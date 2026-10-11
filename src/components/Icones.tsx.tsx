import type { ReactNode } from "react";

type Props = { taille?: number };

function Svg({ taille = 22, epaisseur = 2.2, children }: Props & { epaisseur?: number; children: ReactNode }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconeMaison({ taille }: Props) {
  return (
    <Svg taille={taille}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9.5h13V10" />
      <path d="M10 19.5v-5h4v5" />
    </Svg>
  );
}

export function IconeCoche({ taille }: Props) {
  return (
    <Svg taille={taille}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8 5.2-5.6" />
    </Svg>
  );
}

export function IconeCocheSimple({ taille }: Props) {
  return (
    <Svg taille={taille} epaisseur={3}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function IconePlus({ taille }: Props) {
  return (
    <Svg taille={taille} epaisseur={3}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconeLoupe({ taille }: Props) {
  return (
    <Svg taille={taille}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </Svg>
  );
}

export function IconeCrayon({ taille }: Props) {
  return (
    <Svg taille={taille} epaisseur={2}>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="m14.5 7.5 3 3" />
    </Svg>
  );
}

export function IconeCroix({ taille }: Props) {
  return (
    <Svg taille={taille} epaisseur={2.6}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconeRetour({ taille }: Props) {
  return (
    <Svg taille={taille} epaisseur={2.6}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  );
}

export function IconeCloche({ taille }: Props) {
  return (
    <Svg taille={taille} epaisseur={2}>
      <path d="M6 17v-6a6 6 0 1 1 12 0v6l1.5 2h-15z" />
      <path d="M10 21h4" />
    </Svg>
  );
}

export function IconePoubelle({ taille }: Props) {
  return (
    <Svg taille={taille} epaisseur={2}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.2A1.8 1.8 0 0 0 8.8 21h6.4a1.8 1.8 0 0 0 1.8-1.8L18 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
    </Svg>
  );
}

export function IllustrationVide() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <rect x="14" y="12" width="68" height="72" rx="14" fill="#e4eeff" />
      <rect x="24" y="24" width="30" height="7" rx="3.5" fill="#1550c8" />
      <rect x="24" y="40" width="48" height="6" rx="3" fill="#b9cffa" />
      <rect x="24" y="54" width="36" height="6" rx="3" fill="#b9cffa" />
      <circle cx="68" cy="68" r="15" fill="#0f9d68" stroke="#ffffff" strokeWidth="4" />
      <path d="M61 68 L66 73 L75 62" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoCahier() {
  return (
    <svg width="44" height="44" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect x="14" y="10" width="72" height="80" rx="14" fill="#1550c8" />
      <rect x="28" y="28" width="30" height="7" rx="3.5" fill="#ffffff" />
      <rect x="28" y="46" width="44" height="6" rx="3" fill="#9db9f3" />
      <rect x="28" y="62" width="30" height="6" rx="3" fill="#9db9f3" />
      <circle cx="72" cy="72" r="17" fill="#0f9d68" stroke="#ffffff" strokeWidth="4" />
      <path d="M64 72 L70 78 L81 66" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}