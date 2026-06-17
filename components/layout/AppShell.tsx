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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

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
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col border-r border-slate-100 bg-white px-4 py-6 md:flex dark:border-slate-800 dark:bg-slate-900">
        <Link href="/home" className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
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
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Settings className="h-4 w-4" />
          {t("navSettings")}
        </Link>
      </aside>

      {/* Main content */}
      <main className="min-h-screen pb-20 md:pl-60 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-slate-100 bg-white md:hidden dark:border-slate-800 dark:bg-slate-900">
        {[...mobileNavItems, settingsItem].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors",
                active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"
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
