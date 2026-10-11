import { ImageResponse } from "next/og";

export const dynamic = "force-static";

const TAILLES: Record<string, { px: number; plein: boolean; echelle: number }> = {
  "192": { px: 192, plein: false, echelle: 1 },
  "512": { px: 512, plein: false, echelle: 1 },
  "180": { px: 180, plein: true, echelle: 1 },
  maskable: { px: 512, plein: true, echelle: 0.78 },
};

export function generateStaticParams() {
  return Object.keys(TAILLES).map((taille) => ({ taille }));
}

export async function GET(_requete: Request, contexte: { params: Promise<{ taille: string }> }) {
  const { taille } = await contexte.params;
  const { px, plein, echelle } = TAILLES[taille] ?? TAILLES["512"];
  const logo = px * 0.64 * echelle;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #1f63e6 0%, #0f3a96 60%, #0a2763 100%)",
          borderRadius: plein ? 0 : px * 0.22,
        }}
      >
        <svg width={logo} height={logo} viewBox="0 0 100 100">
          <rect x="14" y="10" width="72" height="80" rx="14" fill="#ffffff" />
          <rect x="28" y="28" width="30" height="7" rx="3.5" fill="#1550c8" />
          <rect x="28" y="46" width="44" height="6" rx="3" fill="#b9cffa" />
          <rect x="28" y="62" width="30" height="6" rx="3" fill="#b9cffa" />
          <circle cx="72" cy="72" r="17" fill="#0f9d68" stroke="#ffffff" strokeWidth="4" />
          <path d="M64 72 L70 78 L81 66" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: px, height: px }
  );
}