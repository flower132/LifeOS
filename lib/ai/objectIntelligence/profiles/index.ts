import { LifeObjectType } from "@/lib/types";
import { AIProfileDefinition, ProfileRegistry } from "../types";
import { personProfileDefinition } from "./personProfile";
import { goalProfileDefinition } from "./goalProfile";
import { selfProfileDefinition } from "./selfProfile";
import { eventProfileDefinition } from "./eventProfile";
import { ideaProfileDefinition } from "./ideaProfile";
import { projectProfileDefinition } from "./projectProfile";
import { knowledgeProfileDefinition } from "./knowledgeProfile";

class ObjectProfileRegistry implements ProfileRegistry {
  private profiles = new Map<LifeObjectType, AIProfileDefinition>();

  get<T extends import("@/lib/types").ObjectAIProfile = import("@/lib/types").ObjectAIProfile>(
    type: LifeObjectType
  ): AIProfileDefinition<T> | undefined {
    return this.profiles.get(type) as AIProfileDefinition<T> | undefined;
  }

  register<T extends import("@/lib/types").ObjectAIProfile = import("@/lib/types").ObjectAIProfile>(
    definition: AIProfileDefinition<T>
  ): void {
    this.profiles.set(definition.type, definition as unknown as AIProfileDefinition);
  }

  has(type: LifeObjectType): boolean {
    return this.profiles.has(type);
  }

  list(): AIProfileDefinition[] {
    return Array.from(this.profiles.values());
  }
}

export const aiProfileRegistry = new ObjectProfileRegistry();

// Register built-in profiles for all LifeObjectTypes.
aiProfileRegistry.register(personProfileDefinition);
aiProfileRegistry.register(goalProfileDefinition);
aiProfileRegistry.register(selfProfileDefinition);
aiProfileRegistry.register(eventProfileDefinition);
aiProfileRegistry.register(ideaProfileDefinition);
aiProfileRegistry.register(projectProfileDefinition);
aiProfileRegistry.register(knowledgeProfileDefinition);

/**
 * Returns true when the registry has a real AI profile for the given type.
 * Future object types without a profile will fall back to manual creation only.
 */
export function isAIProfileSupported(type: LifeObjectType): boolean {
  return aiProfileRegistry.has(type);
}
