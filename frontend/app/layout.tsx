import type { Metadata } from "next";
import "./globals.css";
import ClientProvider from "./ClientProvider";

export const metadata: Metadata = {
  title: "LMS Dashboard",
  description: "Learning Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
