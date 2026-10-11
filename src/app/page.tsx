import type { Metadata } from "next";
import VueListe from "@/src/components/VueListe";

export const metadata: Metadata = { title: { absolute: "Cahier" } };

export default function PageAccueil() {
  return <VueListe mode="cours" />;
}