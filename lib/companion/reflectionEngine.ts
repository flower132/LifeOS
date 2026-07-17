import { v4 as uuidv4 } from "uuid";
import { CompanionContext } from "./types";
import { ReflectionQuestion } from "@/lib/types";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { AIStructuredGenerationRequest } from "@/lib/ai/types";
import { reflectionOutputSchema } from "./schemas";
import {
  buildReflectionPrompt,
  buildMockReflectionOutput,
  selectReflectionSeed,
} from "@/lib/ai/prompts/reflection";

function now(): string {
  return new Date().toISOString();
}

async function callStructured(
  provider: {
    generateStructuredObject(request: AIStructuredGenerationRequest): Promise<string>;
  },
  prompt: string,
  schemaHint?: string
): Promise<unknown> {
  const request: AIStructuredGenerationRequest = {
    prompt,
    schemaHint,
    objectType: "self",
  };
  const text = await provider.generateStructuredObject(request);
  return JSON.parse(text);
}

export async function generateReflection(
  context: CompanionContext,
  existing: ReflectionQuestion[]
): Promise<ReflectionQuestion | null> {
  const seed = selectReflectionSeed(context, existing);
  if (!seed) return null;

  const selected = selectProviderForTask("REFLECTION");
  let output: {
    question: string;
    seedSource: ReflectionQuestion["seedSource"];
    seedId: string;
    evidence: { quote: string; source: string }[];
  };

  if (selected.isMock) {
    output = buildMockReflectionOutput(seed);
  } else {
    const prompt = buildReflectionPrompt(context, seed);
    // Server calls are logged centrally by the /api/ai client proxy.
    try {
      const raw = await callStructured(
        selected.provider,
        prompt,
        JSON.stringify(reflectionOutputSchema.shape)
      );
      const parsed = reflectionOutputSchema.safeParse(raw);
      if (!parsed.success) {
        console.error("[Companion Reflection] Schema parse error:", parsed.error);
        output = buildMockReflectionOutput(seed);
      } else {
        output = parsed.data;
      }
    } catch {
      output = buildMockReflectionOutput(seed);
    }
  }

  return {
    id: uuidv4(),
    date: context.today,
    question: output.question || "今天这条记录，让你想到了什么？",
    seedSource: output.seedSource,
    seedId: output.seedId,
    answer: undefined,
    status: "pending",
    evidence: output.evidence,
    createdAt: now(),
  };
}
