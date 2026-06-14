import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ObjectForm } from "@/components/object/ObjectForm";

export default function CreateObjectPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/objects"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Objects
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create Object
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A person, event, goal, idea, or yourself.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <ObjectForm />
      </div>
    </div>
  );
}
