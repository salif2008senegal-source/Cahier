import type { Metadata } from "next";
import EcranConnexion from "@/src/components/EcranConnexion";

export const metadata: Metadata = { title: "Connexion" };

export default function PageConnexion() {
  return <EcranConnexion />;
}