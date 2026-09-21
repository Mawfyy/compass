import type { Metadata } from "next";
import "./globals.css";
import "@xyflow/react/dist/style.css";

export const metadata: Metadata = {
  title: "StudyGraph — Learning Map Generator",
  description: "Tell me what you want to learn, and I'll build a visual map of the knowledge you need.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
