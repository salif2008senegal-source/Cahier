"use client";

import { useCahier } from "./FournisseurCahier";

export default function ToastCahier() {
  const { toast, fermerToast } = useCahier();
  if (!toast) return null;

  return (
    <div className="toast">
      <div key={toast.id} className="toast__corps" role="status" aria-live="polite">
        <p>{toast.texte}</p>
        {toast.annuler && (
          <button
            type="button"
            className="toast__btn"
            onClick={() => {
              toast.annuler?.();
              fermerToast();
            }}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}