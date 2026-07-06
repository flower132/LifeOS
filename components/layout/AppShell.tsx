"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  PlusCircle,
  StickyNote,
  Settings,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";
import { UserAvatar, UserAvatarFallback } from "@/components/user/UserAvatar";
import { useSyncStore } from "@/stores/syncStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const profile = useSyncStore((s) => s.profile);

  // Sidebar / bottom nav order is driven by these arrays.
  // Desktop sidebar shows Templates; mobile bottom nav has limited space and does not.
  const desktopNavItems = [
    { href: "/create-note", label: t("navNewNote"), icon: StickyNote },
    { href: "/objects", label: t("navObjects"), icon: Users },
    { href: "/create-object", label: t("navNewObject"), icon: PlusCircle },
    { href: "/templates", label: t("navTemplates"), icon: LayoutTemplate },
    { href: "/home", label: t("navHome"), icon: Home },
  ];

  const mobileNavItems = [
    { href: "/home", label: t("navHome"), icon: Home },
    { href: "/objects", label: t("navObjects"), icon: Users },
    { href: "/create-note", label: t("navNewNote"), icon: StickyNote },
    { href: "/create-object", label: t("navNewObject"), icon: PlusCircle },
  ];

  const settingsItem = { href: "/settings", label: t("navSettings"), icon: Settings };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col border-r border-border bg-background px-4 py-6 md:flex">
        <Link href="/home" className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold">
            L
          </div>
          <span className="text-lg font-semibold tracking-tight">{t("appName")}</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          {profile ? <UserAvatar size="sm" /> : <UserAvatarFallback size="sm" />}
          <span className="flex-1">{t("navSettings")}</span>
        </Link>
      </aside>

      {/* Main content */}
      <main className="min-h-screen pb-20 md:pl-60 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-border bg-background md:hidden">
        {[...mobileNavItems, settingsItem].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors",
                active ? "text-accent" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
