import enUS from "./en-US";

/** Japanese starts with the complete English fallback, then overrides shared UI. */
const jaJP = {
  ...enUS,
  "common.cancel": "キャンセル",
  "common.confirm": "確認",
  "common.delete": "削除",
  "common.retry": "再試行",
  "common.save": "保存",
  "common.loading": "読み込み中…",
  "common.back": "戻る",
  "common.object_one": "{count} 件のオブジェクト",
  "common.object_other": "{count} 件のオブジェクト",
  "auth.signIn": "ログイン",
  "auth.signUp": "アカウントを作成",
  "app.loading": "LifeOS を読み込んでいます…",
  "dev.close": "閉じる",
  "dev.export": "データをエクスポート",
  "dev.clear": "すべてのデータを消去",

  // Timeline Insights
  "timelineInsights": "タイムラインインサイト",
  "timelineInsightsEmpty": "記録が増えると、ここにタイムラインインサイトが表示されます。",
  "timeTravel": "タイムトラベル",
  "lifeReplay": "ライフリプレイ",
  "timelineSearch": "タイムライン検索",
  "lifeChapters": "人生の章",

  // Insight content
  "insight.streak.title": "{name} を {days} 日連続で進めています。",
  "insight.streak.detail": "このペースを維持しましょう。",
  "insight.growing.title": "最近最も連絡が増えたのは：{name}。",
  "insight.growing.detail": "過去30日間の交流 +{delta} 回。",
  "insight.slowing.title": "今月：「{name}」の進捗が落ちています。",
  "insight.slowing.detail": "優先順位の再調整を検討してください。",

  // Today's Focus — UI labels
  "todayFocusLoading": "今日のフォーカスを生成中…",
  "whyNow": "なぜ今なのか",
  "done": "完了",

  // Today's Focus — fallback & mock content
  "focus.fallbackSelfTitle": "自分",
  "focus.fallbackSelfExplanation": "最近記録が少ないので、まず自分を見つめてみましょう。",
  "focus.fallbackSelfWhyNow": "生活が静かな時、自分の状態に関心を持つことも優しい寄り添い方です。",
  "focus.fallbackMemoryTitle": "小さな出来事を記録する",
  "focus.fallbackMemoryExplanation": "記録が増えるほど、あなたを深く理解できます。",
  "focus.fallbackMemoryWhyNow": "まだ十分な記録がありません。小さな出来事も理解の始まりになります。",
  "focus.defaultExplanation": "今日はこのテーマにもう少し注意を払ってみませんか。",
  "focus.mockWhyNow": "最近あなたの記録に現れていることに気づきました。",
  "focus.defaultWhyNow": "最近あなたの記録に現れています。",
  "focus.noNotes": "（関連するメモリがありません）",
  "focus.relationshipAnd": " と ",
  "focus.aRelationship": "ある関係",
  "focus.aMemory": "ある記憶",
};

export default jaJP;
