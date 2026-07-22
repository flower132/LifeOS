import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Object Recency — 记录对象的「最近查看 / 最近关联」时间，
 * 供 ObjectPicker 按「最近使用」排序与 Recent 区展示。
 *
 * 最近更新 / 最近创建直接读 LifeObject.updated_at / created_at，
 * 这里只补充对象本身没有的两类信号。
 */

interface RecencyEntry {
  viewedAt?: number;
  linkedAt?: number;
}

interface ObjectRecencyState {
  entries: Record<string, RecencyEntry>;
  markViewed: (id: string) => void;
  markLinked: (ids: string[]) => void;
}

export const useObjectRecencyStore = create<ObjectRecencyState>()(
  persist(
    (set) => ({
      entries: {},

      markViewed: (id) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [id]: { ...state.entries[id], viewedAt: Date.now() },
          },
        })),

      markLinked: (ids) =>
        set((state) => {
          const now = Date.now();
          const entries = { ...state.entries };
          for (const id of ids) {
            entries[id] = { ...entries[id], linkedAt: now };
          }
          return { entries };
        }),
    }),
    { name: "lifeos.objectRecency.v1" }
  )
);

/** 对象的综合最近活跃时间（更新 / 创建 / 查看 / 关联取最大）。 */
export function recencyScore(
  object: { id: string; created_at: string; updated_at: string },
  entry?: RecencyEntry
): number {
  const times = [
    Date.parse(object.updated_at),
    Date.parse(object.created_at),
    entry?.viewedAt ?? 0,
    entry?.linkedAt ?? 0,
  ];
  return Math.max(...times.map((t) => (Number.isNaN(t) ? 0 : t)));
}
