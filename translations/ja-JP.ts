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

  // Settings — companion & notifications
  "companionSettings": "Daily Companion",
  "companionEnabled": "Daily Companion を有効にする",
  "allowNotifications": "毎日のリマインダー通知を許可",
  "companionSettingsDescription": "Daily Companion は毎日最も重要なことだけを表示します：Today Focus、Today Story、そして穏やかな夜の振り返り。",
  "aiServerManagedDescription": "AI はサーバーで管理されています。キーはブラウザに表示されません。",
  "backToSettings": "設定に戻る",

  // Home — insights
  "todaysInsight": "今日のインサイト",
  "graphInsights": "グラフインサイト",

  // Home — reflection
  "reflectionLoading": "今夜の振り返りを準備中...",
  "eveningReflection": "今夜の振り返り",
  "reflectionPlaceholder": "よければ何か書いてみてください...",
  "answer": "回答",

  // Home — reminder
  "reminderLoading": "今日のリマインダーを確認中...",
  "todayReminder": "今日のリマインダー",
  "later": "後で",
  "skip": "スキップ",

  // Home — timeline explorer
  "oneWeekAgo": "1週間前",
  "oneMonthAgo": "1ヶ月前",
  "oneYearAgo": "1年前",
  "readOnly": "読み取り専用、履歴は変更できません",
  "activeGoals": "進行中の目標",
  "activeProjects": "進行中のプロジェクト",
  "peopleContacted": "連絡先",
  "ifBackToThatDay": "もしその日に戻れたら",
  "thisMonth": "今月",
  "thisQuarter": "今季度",
  "thisYear": "今年",
  "replayEmpty": "この期間のリプレイを生成するための記録が不足しています。",
  "replayAIInsight": "AI 要約",
  "replayActivePeople": "アクティブな人",
  "replayActiveProjects": "アクティブなプロジェクト",
  "replayGoalsProgressed": "進捗中の目標",
  "replayKeyMoments": "重要な瞬間",
  "replayShowMore": "{count} 件すべて表示",
  "replayShowLess": "折りたたむ",

  // AI Summary（共通 AISummaryCard コンポーネント）
  "aiSummary": "AI 要約",
  "aiSummaryGenerating": "AI が要約を生成しています…",
  "aiSummaryFailed": "要約の生成に失敗しました。もう一度お試しください。",
  "aiSummaryEmpty": "要約を生成するための記録がまだ不足しています。",

  // ObjectPicker（共通オブジェクト選択コンポーネント）
  "recentObjects": "最近のオブジェクト",
  "searchObjects": "オブジェクトを検索...",
  "selectObject": "オブジェクトを選択...",
  "pickerNoResults": "一致するオブジェクトが見つかりません",
  "pickerCreateNew": "新しいオブジェクトを作成",
  "pickerCreateNamed": "「{name}」を作成",
  "pickerAllObjects": "すべてのオブジェクト",
  "pickerSelected": "{count} 件選択中",
  "pickerClear": "クリア",
  "pickerSuggested": "AI のおすすめ",
  "replayEvents": "イベント",
  "replayMemories": "記憶",
  "replayNotes": "ノート",
  "replayNewRelations": "新しい関係",
  "view": "見る",
  "travelEmptyTitle": "この期間の記録はありません",
  "travelEmptyDescription": "この時点のデータはまだありません。記録を続ければ、いつかこの日付に戻ってこられるでしょう。",
  "travelSparseData": "この期間の記録はわずかです。スナップショットは限られていますが、すべての記録に意味があります。",
  "todayFocusLabel": "今日のフォーカス",
  "timelineSearchPlaceholder": "例：張三と初めて会ったのはいつ？今年達成した目標は？",
  "search": "検索",
  "timelineSearchHint": "回答はタイムラインからのみ、自由な生成はありません。",
  "generateChapters": "AI チャプター生成",
  "chaptersEmpty": "チャプターがまだありません。「AI チャプター生成」をクリックして、AI にタイムラインから人生の段階を分割させましょう。",
  "renameChapter": "クリックして名前を変更",
  "ongoing": "進行中",
  "splitChapter": "分割",
  "confirm": "確認",

  // Object intelligence
  "aiProfileBuilding": "AI がこのオブジェクトを理解中です。後で戻ってプロフィールを確認してください。",
  "aiUnderstanding": "AI 理解",
  "communicationAssistant": "AI コミュニケーションアシスタント",
  "refresh": "更新",
  "graphSummary": "グラフサマリー",
  "recentChanges": "最近の変更",
  "suggestionLabel": "提案",
  "communicationSituationPlaceholder": "直面するコミュニケーション状況を説明してください。例：今日上司に予算を申請する必要があります。",
  "analyzing": "分析中…",
  "getCommunicationAdvice": "コミュニケーションアドバイスを取得",
  "communicationAdviceFailed": "アドバイスを生成できません。後でもう一度お試しください。",
  "adviceLabel": "アドバイス",
  "warningsLabel": "注意",
  "suggestedApproachLabel": "推奨アプローチ",
  "possibleReactionsLabel": "可能的反応",

  // Object timeline
  "timelineEmpty": "このオブジェクトにはまだタイムライン記録がありません。",
  "relationshipEvolution": "関係の変化",
  "projectHistory": "プロジェクト履歴",
  "goalRoadmap": "目標ロードマップ",

  // Relations
  "relationTimeline": "関係タイムライン",
  "deleteRelationConfirm": "この関係を削除しますか？",
  "relationSuggestions": "AI が発見した関係（確認後グラフに追加）",
  "accept": "受け入れる",
  "reject": "拒否",
  "relationCreatedByUser": "手動",
  "explainRelation": "この関係を説明",
  "editRelation": "関係を編集",
  "deleteRelation": "関係を削除",
  "relationType": "関係タイプ",
  "relationLabel": "関係ラベル",
  "relationLabelPlaceholder": "例：共同プロジェクト",
  "relationNote": "関係の説明",
  "saving": "保存中…",
  "sharedProjects": "共有プロジェクト",
  "sharedGoals": "共有目標",

  // Intelligence cards
  "weeklyReviewLoading": "今週のレビューを準備中...",
  "weeklyReview": "今週のレビュー",
  "mostImportantPerson": "最も重要な人",
  "mostImportantGoal": "最も重要な目標",
  "growth": "成長",
  "emotion": "感情",
  "gratitude": "感謝",
  "dismiss": "無視",
  "monthlyStoryLoading": "今月のストーリーを書いています...",
  "monthlyStory": "今月のストーリー",
  "patterns": "パターン",
  "hideEvidence": "エビデンスを隠す",
  "viewEvidence": "エビデンスを見る",
  "thisIsMe": "はい、これは私です",
  "thisIsNotMe": "これは私ではありません",

  // AI suggestions
  "aiSuggestionsActive": "アクティブ",
  "aiNoActiveSuggestions": "アクティブな提案はありません。",
  "aiSuggestionsDone": "完了",
  "aiSuggestionsDismissed": "却下",
  "completedAt": "完了日",
  "aiProfileRollingSummary": "ローリングサマリー",

  // History
  "collapse": "折りたたむ",
  "expand": "展開",

  // Type
  "type": "タイプ",
};

export default jaJP;
