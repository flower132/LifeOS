"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncStore } from "@/stores/syncStore";
import { useTranslation } from "@/lib/useTranslation";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
}

const sizeClass: Record<string, { wrapper: string; emoji: string; fallback: string }> = {
  sm: {
    wrapper: "h-8 w-8 rounded-lg",
    emoji: "text-lg",
    fallback: "text-xs",
  },
  md: {
    wrapper: "h-10 w-10 rounded-xl",
    emoji: "text-xl",
    fallback: "text-sm",
  },
  lg: {
    wrapper: "h-16 w-16 rounded-2xl",
    emoji: "text-3xl",
    fallback: "text-xl",
  },
};

export function UserAvatar({ size = "md", className, href }: UserAvatarProps) {
  const profile = useSyncStore((s) => s.profile);
  const { t } = useTranslation();
  const { wrapper, emoji, fallback } = sizeClass[size];

  const initials =
    profile?.displayName?.slice(0, 1).toUpperCase() ||
    profile?.email?.slice(0, 1).toUpperCase() ||
    "?";

  const content = (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-accent font-semibold text-accent-foreground shadow-sm",
        wrapper,
        className
      )}
      aria-label={profile?.displayName ?? t("a11y.userAvatar")}
    >
      {profile?.avatarEmoji ? (
        <span className={emoji}>{profile.avatarEmoji}</span>
      ) : (
        <span className={fallback}>{initials}</span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}

export function UserAvatarFallback({ size = "md", className }: Omit<UserAvatarProps, "href">) {
  const { wrapper, fallback } = sizeClass[size];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-muted text-muted-foreground",
        wrapper,
        className
      )}
    >
      <User className={fallback === "text-xs" ? "h-4 w-4" : fallback === "text-sm" ? "h-5 w-5" : "h-6 w-6"} />
    </span>
  );
}
