"use client";

import { useSearchParams } from "next/navigation";
import { AdvisorClient } from "./AdvisorClient";

export default function AdvisorPage() {
  const searchParams = useSearchParams();
  const objectId = searchParams.get("objectId") ?? undefined;

  return <AdvisorClient objectId={objectId} />;
}
