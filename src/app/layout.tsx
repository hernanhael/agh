import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

/**
 * IBM Plex Sans en toda la aplicación: una sola familia, para todo.
 *
 * La jerarquía se construye con peso, tamaño y color, no con familias
 * distintas. Tiene versión variable, así que se carga sin fijar pesos y se
 * dispone de todo el rango en un solo archivo.
 */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "agh-IAwyer",
  description: "Estudio jurídico virtual — Agenda, Expedientes, IA y Guías.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${plexSans.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-screen">
        <Nav />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
