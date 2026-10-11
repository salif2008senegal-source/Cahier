import type { Metadata } from "next";
import { Suspense } from "react";
import FormulaireDette from "@/src/components/FormulaireDette";

export const metadata: Metadata = { title: "Nouveau crédit" };

export default function PageNouveau() {
  return (
    <Suspense fallback={<div className="page page--sans-barre" />}>
      <FormulaireDette />
    </Suspense>
  );
}