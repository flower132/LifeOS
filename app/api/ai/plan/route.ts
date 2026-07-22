import { getPlanSettings } from "@/lib/ai/plans";
import { getRemainingQuota } from "@/lib/ai/quota";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// 当前用户 Plan 视图 —— Settings 预留 API（当前无 UI）。
//
// GET /api/ai/plan → { plan: PlanSettingsView, quota: QuotaStatus }
//   当前 Plan / 剩余额度 / Trial 剩余天数 / 升级入口（预留，available=false）
// ---------------------------------------------------------------------------

export async function GET(): Promise<Response> {
  // User identity: no server auth yet — reserved for Supabase session wiring.
  const userId = "local";

  try {
    const [plan, quota] = await Promise.all([
      getPlanSettings(userId),
      getRemainingQuota(userId),
    ]);
    return Response.json({ success: true, plan, quota }, { status: 200 });
  } catch (err) {
    console.error("[ai-plan] status failed:", err);
    return Response.json(
      { success: false, error: { code: "unknown", message: "Failed to load plan status" } },
      { status: 500 }
    );
  }
}
