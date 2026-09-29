import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configuración de los tests. El único ajuste necesario es el alias `@/`,
 * que en la aplicación resuelve Next.js desde `tsconfig.json` y acá hay que
 * declarar para Vite.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` es un marcador: su entrada por defecto lanza para avisar
      // que el módulo no puede ir al cliente. Los tests corren en Node, donde
      // esa condición no aplica, así que se apunta al módulo vacío que el
      // propio paquete trae para los entornos de servidor.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
