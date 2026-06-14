import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NoteForm } from "@/components/note/NoteForm";

export default function CreateNotePage({
  searchParams,
}: {
  searchParams?: { objectId?: string };
}) {
  const objectId = searchParams?.objectId;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <Link
            href={objectId ? `/objects/${objectId}` : "/home"}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {objectId ? "Back to object" : "Home"}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create Note
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record a thought, event, or observation.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <NoteForm initialObjectId={objectId} />
      </div>
    </div>
  );
}
