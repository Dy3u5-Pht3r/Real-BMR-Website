import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "riaayahBMR",
  description:
    "Muslim community safety & resource map for the Bangkok Metropolitan Region.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
