import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Cahier, crédits clients",
    short_name: "Cahier",
    description: "Le cahier de crédits de votre boutique, sur votre téléphone.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f6fc",
    theme_color: "#1550c8",
    categories: ["business", "finance"],
    icons: [
      { src: "/icones/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Ajouter un bor",
        short_name: "Bor",
        url: "/nouveau",
        icons: [{ src: "/icones/192", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}