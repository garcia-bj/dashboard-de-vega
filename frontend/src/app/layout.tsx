import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "De Vega | Generador de Imágenes IA",
  description: "Genera imágenes con IA y autopublícalas en Meta",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-surface text-on-surface min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
