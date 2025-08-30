import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/auth-context";
import { LayoutWrapper } from "./components/layout/layout-wrapper";

export const metadata: Metadata = {
  title: "GBR Management System",
  description: "Modern management system built",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
  {/* Favicon and icons - use the goldbod logo in public/goldbod-logo.webp */}
  <link rel="icon" href="/goldbod-logo.webp" type="image/webp" />
  <link rel="shortcut icon" href="/goldbod-logo.webp" />
  <link rel="apple-touch-icon" href="/goldbod-logo.webp" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
