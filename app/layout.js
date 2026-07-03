import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "Quiz Dinâmico — Descubra seu Plano Personalizado",
  description: "Funil de qualificação em pt-BR com cálculo de IMC e redirect para checkout.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
