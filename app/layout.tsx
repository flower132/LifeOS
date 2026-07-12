import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "LifeOS — Life Data Structure System",
  description:
    "A personal life operating system: people, events, goals, ideas, and AI understanding.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "LifeOS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ErrorBoundary>
          <ClientProviders>{children}</ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
