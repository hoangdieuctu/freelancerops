import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "FreelanceOps",
  description: "Freelancer team management",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body style={{ height: "100%", display: "flex", margin: 0, overflow: "hidden" }} className="noise-bg">
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
