import { create } from "zustand";
import { storage } from "@/lib/storage";
import {
  Template,
  TemplateCategory,
  TemplateCreateInput,
  TemplateUpdateInput,
} from "@/lib/types";
import { subscribe, emit } from "./storeEvents";

interface TemplateState {
  templates: Template[];
  loaded: boolean;
  _loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => void;
  addTemplate: (template: TemplateCreateInput) => Promise<Template>;
  updateTemplate: (id: string, updates: TemplateUpdateInput) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<Template>;
  incrementUsage: (id: string) => Promise<void>;
  getById: (id: string) => Template | undefined;
  getByCategory: (category: TemplateCategory) => Template[];
  getDefaultByCategory: (category: TemplateCategory) => Template[];
  getCustom: () => Template[];
  search: (query: string) => Template[];
  getRecent: (limit?: number) => Template[];
}

function sortByName(a: Template, b: Template): number {
  return a.name.localeCompare(b.name);
}

function sortByRecent(a: Template, b: Template): number {
  const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
  const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
  return bTime - aTime;
}

export const useTemplateStore = create<TemplateState>((set, get) => {
  if (typeof window !== "undefined") {
    subscribe("templatesChanged", () => {
      void get().load();
    });
  }

  return {
    templates: [],
    loaded: false,
    _loading: false,
    error: null,

    load: async () => {
      set({ _loading: true, error: null });
      try {
        const templates = await storage.getTemplates();
        set({ templates, loaded: true, _loading: false });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load templates";
        set({ error: message, loaded: true, _loading: false });
      }
    },

    hydrate: async () => get().load(),
    persist: () => undefined,

    addTemplate: async (template) => {
      try {
        const created = await storage.createTemplate(template);
        set((state) => ({
          templates: [...state.templates, created].sort(sortByName),
          error: null,
        }));
        emit("templatesChanged");
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create template";
        set({ error: message });
        throw err;
      }
    },

    updateTemplate: async (id, updates) => {
      try {
        const updated = await storage.updateTemplate(id, updates);
        set((state) => ({
          templates: state.templates
            .map((t) => (t.id === id ? updated : t))
            .sort(sortByName),
          error: null,
        }));
        emit("templatesChanged");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update template";
        set({ error: message });
        throw err;
      }
    },

    removeTemplate: async (id) => {
      try {
        await storage.deleteTemplate(id);
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          error: null,
        }));
        emit("templatesChanged");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete template";
        set({ error: message });
        throw err;
      }
    },

    duplicateTemplate: async (id) => {
      const original = get().getById(id);
      if (!original) throw new Error("Template not found");

      const copy: TemplateCreateInput = {
        name: `${original.name} (${t("copySuffix")})`,
        category: original.category,
        isDefault: false,
        content: original.content,
      };

      return get().addTemplate(copy);
    },

    incrementUsage: async (id) => {
      const template = get().getById(id);
      if (!template) return;

      const usageCount = template.usageCount + 1;
      const lastUsedAt = new Date().toISOString();
      await get().updateTemplate(id, { usageCount, lastUsedAt });
    },

    getById: (id) => get().templates.find((t) => t.id === id),

    getByCategory: (category) =>
      get()
        .templates.filter((t) => t.category === category)
        .sort(sortByName),

    getDefaultByCategory: (category) =>
      get()
        .templates.filter((t) => t.isDefault && t.category === category)
        .sort(sortByName),

    getCustom: () =>
      get()
        .templates.filter((t) => !t.isDefault)
        .sort(sortByName),

    search: (query) => {
      const q = query.trim().toLowerCase();
      if (!q) return get().templates.slice().sort(sortByName);
      return get().templates
        .filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.content.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        )
        .sort(sortByName);
    },

    getRecent: (limit = 5) => {
      return get()
        .templates.filter((t) => t.lastUsedAt)
        .sort(sortByRecent)
        .slice(0, limit);
    },
  };
});

// Tiny helper used inside the store for duplicate naming. It is not a React hook.
function t(key: string): string {
  const en: Record<string, string> = {
    copySuffix: "Copy",
  };
  return en[key] ?? key;
}
