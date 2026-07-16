import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useLongTermMemoryStore } from "@/stores/longTermMemoryStore";
import { buildMemoryStream } from "./memoryStream";
import { detectMoments } from "./momentEngine";
import { detectChapters } from "./chapterEngine";
import { buildMemoryConnections } from "./memoryConnectionEngine";
import { buildAnniversaries } from "./anniversaryEngine";
import { buildHighlights } from "./highlightEngine";

/**
 * LongTermMemoryService — 长期记忆编排器。
 *
 * 后台自动驱动所有引擎：
 *   Notes / Objects / Reflections（一手数据）
 *     → MomentEngine（时刻）
 *     → ChapterEngine（章节）
 *     → MemoryConnectionEngine（记忆关联）
 *     → AnniversaryEngine（周年）
 *     → HighlightEngine（亮点）
 *   → 写入 longTermMemoryStore → storage（Local / Cloud 同步）
 *
 * 触发时机：对象 / 笔记 / 关系变化后（防抖），以及应用启动时。
 * 页面与 Store 不直接调用引擎。
 */

const REFRESH_DEBOUNCE_MS = 2000;

class LongTermMemoryService {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private refreshing = false;
  private initialized = false;

  /** 订阅一手数据变化。应用启动时调用一次。 */
  init(): void {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    // 直接订阅 zustand 状态变化（add/update/delete 都会触发），
    // 数组引用比较即可识别变化，成本可忽略。
    let prevObjects = useObjectStore.getState().objects;
    let prevNotes = useNoteStore.getState().notes;
    let prevRelations = useRelationStore.getState().relations;
    let prevDecisions = useLongTermMemoryStore.getState().decisions;

    useObjectStore.subscribe((state) => {
      if (state.objects !== prevObjects) {
        prevObjects = state.objects;
        this.scheduleRefresh();
      }
    });
    useNoteStore.subscribe((state) => {
      if (state.notes !== prevNotes) {
        prevNotes = state.notes;
        this.scheduleRefresh();
      }
    });
    useRelationStore.subscribe((state) => {
      if (state.relations !== prevRelations) {
        prevRelations = state.relations;
        this.scheduleRefresh();
      }
    });
    // Decision 变化影响 Highlights / 记忆流
    useLongTermMemoryStore.subscribe((state) => {
      if (state.decisions !== prevDecisions) {
        prevDecisions = state.decisions;
        this.scheduleRefresh();
      }
    });
  }

  scheduleRefresh(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.refresh();
    }, REFRESH_DEBOUNCE_MS);
  }

  /** 全量重算长期记忆派生数据（幂等）。 */
  async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      const objects = useObjectStore.getState().objects;
      const notes = useNoteStore.getState().notes;
      const reflections = useIntelligenceStore.getState().cache.reflections;
      const ltm = useLongTermMemoryStore.getState();

      if (!ltm.loaded) return; // 等待 hydrate 完成，避免覆盖持久数据

      // 1. Moments：先算时刻（章节 / 周年依赖它）
      const moments = detectMoments({ objects, notes }, ltm.moments);

      // 2. Chapters：基于记忆流 + 时刻边界
      const chapters = detectChapters({ objects, notes, moments }, ltm.chapters);

      // 3. 统一记忆流（含 moments / decisions / reflections）
      const records = buildMemoryStream({
        notes,
        objects,
        moments,
        decisions: ltm.decisions,
        reflections,
      });

      // 4. Memory Connections
      const memoryRelations = buildMemoryConnections(
        { records, objects, reflections },
        ltm.memoryRelations
      );

      // 5. Anniversaries
      const anniversaries = buildAnniversaries(
        { objects, moments },
        ltm.anniversaries
      );

      // 6. Highlights
      const highlights = buildHighlights(
        { records, moments, decisions: ltm.decisions, reflections },
        ltm.highlights
      );

      await ltm.setDerived({
        moments,
        chapters,
        memoryRelations,
        anniversaries,
        highlights,
      });
    } catch (err) {
      console.error("[LongTermMemory] refresh failed:", err);
    } finally {
      this.refreshing = false;
    }
  }
}

export const longTermMemoryService = new LongTermMemoryService();
