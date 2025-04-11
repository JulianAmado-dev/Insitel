// src/components/Layout.jsx
import { ThemeProvider } from "./ThemeProvider"; // Ajusta la ruta
import "../../global.css"; // Importa tus estilos globales

export default function Layout({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <div className="font-inter"> {/* Aplica la fuente Inter manualmente */}
        {children}
      </div>
    </ThemeProvider>
  );
}