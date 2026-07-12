"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useAuthActions } from "@/lib/auth/useAuthActions";
import { useSyncStore } from "@/stores/syncStore";
import { useTranslation } from "@/lib/useTranslation";

const EMOJI_OPTIONS = ["😀", "🧠", "💡", "🌱", "✨", "🌙", "🔥", "❄️", "🌊", "🪐"];

export function ProfileEditor() {
  const { t } = useTranslation();
  const profile = useSyncStore((s) => s.profile);
  const { updateProfile } = useAuthActions();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [avatarEmoji, setAvatarEmoji] = useState(profile?.avatarEmoji ?? "");

  if (!profile) return null;

  const handleSave = async () => {
    await updateProfile({
      displayName: displayName.trim() || profile.email.split("@")[0] || "",
      avatarEmoji: avatarEmoji || undefined,
    });
    setIsEditing(false);
  };

  const initials = profile.displayName.slice(0, 1).toUpperCase() ||
    profile.email.slice(0, 1).toUpperCase() ||
    "?";

  return (
    <div className="flex items-start gap-4">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-semibold text-accent-foreground shadow-sm">
          {profile.avatarEmoji ? (
            <span className="text-3xl">{profile.avatarEmoji}</span>
          ) : (
            initials
          )}
        </div>
        {isEditing && (
          <div className="mt-2 flex max-w-[4rem] flex-wrap gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatarEmoji(emoji)}
                className={`h-6 w-6 rounded text-sm transition-colors ${
                  avatarEmoji === emoji
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAvatarEmoji("")}
              className="h-6 w-6 rounded bg-muted text-xs text-muted-foreground hover:bg-muted/80"
            >
              {t("profileEditorRemoveAvatar")}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("profileEditorNicknamePlaceholder")}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-accent p-2 text-accent-foreground hover:bg-accent/90"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setDisplayName(profile.displayName);
                setAvatarEmoji(profile.avatarEmoji ?? "");
              }}
              className="rounded-xl border border-input bg-background p-2 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">{profile.displayName}</span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>
    </div>
  );
}
