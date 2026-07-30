import type { Metadata } from "next";
import { Dancing_Script, Cormorant_Garamond, Quicksand } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Nav from "@/components/Nav";
import AmbientHearts from "@/components/AmbientHearts";
import Toast from "@/components/Toast";

const display = Dancing_Script({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display-raw",
});
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-raw",
});
const ui = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui-raw",
});

export const metadata: Metadata = {
  title: "Letters to My Love",
  description: "Write your heart. Keep every memory safe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${display.variable} ${serif.variable} ${ui.variable}`}>
          <AmbientHearts />
          <Toast />
          <div id="app-shell">
            <Nav />
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
