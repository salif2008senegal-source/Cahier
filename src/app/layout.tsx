import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import type { ReactNode } from "react";
import BarreOnglets from "@/src/components/BarreOnglets";
import EnregistreurSW from "@/src/components/EnregistreurSW";
import { FournisseurAuth } from "@/src/components/FournisseurAuth";
import { FournisseurCahier } from "@/src/components/FournisseurCahier";
import GardeAcces from "@/src/components/GardeAcces";
import ToastCahier from "@/src/components/ToastCahier";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Cahier", template: "%s | Cahier" },
  description: "Le cahier de crédits de votre boutique, sur votre téléphone.",
  applicationName: "Cahier",
  appleWebApp: { capable: true, title: "Cahier", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icones/192", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icones/180", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1550c8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={nunito.variable}>
      <body>
        <FournisseurAuth>
          <FournisseurCahier>
            <GardeAcces />
            <div className="appli">
              <main>{children}</main>
            </div>
            <ToastCahier />
            <BarreOnglets />
          </FournisseurCahier>
        </FournisseurAuth>
        <EnregistreurSW />
      </body>
    </html>
  );
}