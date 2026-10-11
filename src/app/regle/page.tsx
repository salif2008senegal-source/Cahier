import type { Metadata } from "next";
import VueListe from "@/src/components/VueListe";

export const metadata: Metadata = { title: "Réglé" };

export default function PageRegle() {
  return <VueListe mode="regle" />;
}