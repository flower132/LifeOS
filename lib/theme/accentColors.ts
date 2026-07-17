/**
 * Accent Color System — LifeOS 统一主题色配置。
 *
 * 所有主题色唯一定义在这里。组件只允许引用 CSS Variables
 * （var(--accent) / Tailwind 的 accent token），禁止写死颜色。
 *
 * 新增颜色只需在 ACCENT_COLORS 中增加一项：
 * 类型、取色器、CSS 变量写入、持久化全部自动生效，无需改动任何组件。
 */

export type AccentColorId =
  | "purple"
  | "blue"
  | "green"
  | "orange"
  | "pink"
  | "red"
  | "teal";

/** 一套主题色在某个明暗模式下的完整 CSS 变量值 */
export interface AccentColorTheme {
  /** 主色：bg-accent / text-accent / border-accent / ring-accent */
  accent: string;
  /** 柔和底色：bg-accent/10 类场景的基底（--accent-soft） */
  accentSoft: string;
  /** 主色上的文字色 */
  accentForeground: string;
  /** Focus Ring 阴影（--shadow-focus） */
  shadowFocus: string;
}

export interface AccentColorDefinition {
  id: AccentColorId;
  /** 取色器色板展示色（light 模式主色） */
  swatch: string;
  light: AccentColorTheme;
  dark: AccentColorTheme;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildTheme(accent: string): AccentColorTheme {
  return {
    accent,
    accentSoft: withAlpha(accent, 0.1),
    accentForeground: "#ffffff",
    shadowFocus: `0 0 0 3px ${withAlpha(accent, 0.18)}`,
  };
}

function defineAccentColor(
  id: AccentColorId,
  lightAccent: string,
  darkAccent: string
): AccentColorDefinition {
  return {
    id,
    swatch: lightAccent,
    light: buildTheme(lightAccent),
    dark: buildTheme(darkAccent),
  };
}

// ── registry ─────────────────────────────────────────────────────────────────

export const ACCENT_COLORS: Record<AccentColorId, AccentColorDefinition> = {
  purple: defineAccentColor("purple", "#7c5cff", "#8f71ff"),
  blue: defineAccentColor("blue", "#3b82f6", "#60a5fa"),
  green: defineAccentColor("green", "#22c55e", "#4ade80"),
  orange: defineAccentColor("orange", "#f97316", "#fb923c"),
  pink: defineAccentColor("pink", "#ec4899", "#f472b6"),
  red: defineAccentColor("red", "#ef4444", "#f87171"),
  teal: defineAccentColor("teal", "#14b8a6", "#2dd4bf"),
};

export const ACCENT_COLOR_IDS: AccentColorId[] = [
  "purple",
  "blue",
  "green",
  "orange",
  "pink",
  "red",
  "teal",
];

export const DEFAULT_ACCENT_COLOR: AccentColorId = "purple";

export function isAccentColorId(value: unknown): value is AccentColorId {
  return (
    typeof value === "string" &&
    (ACCENT_COLOR_IDS as string[]).includes(value)
  );
}

export type AccentCssVariable =
  | "--accent"
  | "--accent-soft"
  | "--accent-foreground"
  | "--shadow-focus";

/**
 * 生成需要写入 document.documentElement 的 CSS 变量键值对。
 * ClientProviders 统一调用，禁止各处自行 setProperty。
 */
export function getAccentCssVariables(
  id: AccentColorId,
  mode: "light" | "dark"
): Record<AccentCssVariable, string> {
  const theme = ACCENT_COLORS[id][mode];
  return {
    "--accent": theme.accent,
    "--accent-soft": theme.accentSoft,
    "--accent-foreground": theme.accentForeground,
    "--shadow-focus": theme.shadowFocus,
  };
}
