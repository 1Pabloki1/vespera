import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vespera — Active Recall & Precision Typing",
  description:
    "Тренажер активного воспроизведения: перевод с русского на английский методом слепой печати. Когнитивная телеметрия, SRS-очередь слабых мест, ИИ-разбор ошибок.",
  openGraph: {
    title: "Vespera — Active Recall & Precision Typing",
    description:
      "Перевод RU→EN методом слепой печати: активное воспроизведение, когнитивная телеметрия, ИИ-разбор ошибок.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#111113",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
