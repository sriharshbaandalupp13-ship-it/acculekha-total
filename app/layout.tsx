import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acculekhaa Catalogue",
  description: "AI Campus Management Solutions Catalogue"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
