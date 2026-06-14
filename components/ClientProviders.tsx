"use client";

import { useEffect } from "react";
import {
  useObjectStore,
  useNoteStore,
  useRelationStore,
  useTagStore,
} from "@/stores";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load stores from storage
    void useObjectStore.getState().load();
    void useNoteStore.getState().load();
    void useRelationStore.getState().load();
    void useTagStore.getState().load();

    // Register service worker for PWA
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    }
  }, []);

  return children;
}
