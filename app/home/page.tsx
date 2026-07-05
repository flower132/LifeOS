"use client";

import Link from "next/link";
import { PlusCircle, Users, StickyNote } from "lucide-react";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { QuickCapture } from "@/components/capture/QuickCapture";
import { ObjectCard } from "@/components/object/ObjectCard";
import { NoteCard } from "@/components/note/NoteCard";
import { TodayFocusCard } from "./TodayFocusCard";
import { SelfSummaryCard } from "./SelfSummaryCard";
import { useTranslation } from "@/lib/useTranslation";

export default function HomePage() {
  const { objects, loaded: objectsLoaded } = useObjectStore();
  const { notes, loaded: notesLoaded } = useNoteStore();
  const { t } = useTranslation();

  const recentObjects = objects
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 6);

  const recentNotes = notes
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("homeTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("homeSubtitle")}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-6">
        <QuickCapture />

        <SelfSummaryCard />

        <TodayFocusCard />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                {t("recentObjects")}
              </h2>
            </div>
            <Link
              href="/create-object"
              className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              {t("new")}
            </Link>
          </div>

          {!objectsLoaded ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : recentObjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentObjects.map((object) => (
                <ObjectCard key={object.id} object={object} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center">
              <p className="text-sm text-muted-foreground">{t("noObjectsYet")}</p>
              <Link
                href="/create-object"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/90"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                {t("createObject")}
              </Link>
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                {t("recentNotes")}
              </h2>
            </div>
            <Link
              href="/create-note"
              className="text-sm font-medium text-accent hover:text-accent/90"
            >
              {t("viewAll")}
            </Link>
          </div>

          {!notesLoaded ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : recentNotes.length > 0 ? (
            <div className="space-y-4">
              {recentNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center">
              <p className="text-sm text-muted-foreground">{t("noNotesYet")}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
