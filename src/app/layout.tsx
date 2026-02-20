import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boardify",
  description: "Boardify your game nights.",
  icons: {
    icon: [
      { url: "/favicon-circle.ico" },
      { url: "/favicon-circle.png", type: "image/png" },
    ],
    shortcut: "/favicon-circle.ico",
    apple: "/favicon-circle.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.classList.toggle('dark', resolved === 'dark');
                  document.documentElement.setAttribute('data-theme', resolved);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <Navbar />
            <main>{children}</main>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
