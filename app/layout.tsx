import { AuthGuard } from "@/components/auth/auth-guard";
import SupabaseProvider from "@/components/auth/supabase-provider";
import { Navbar } from "@/components/layout/navbar";
import { createClient } from "@/lib/supabase/server";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Cosmara | Premium Car Hire in Nairobi, Kenya",
    template: "%s | Cosmara Car Hire",
  },
  description:
    "Cosmara offers premium car hire in Nairobi and across Kenya. Compact, executive, SUV, luxury, safari and wedding vehicles available. Book online or via WhatsApp.",
  keywords: [
    "car hire Nairobi",
    "car rental Kenya",
    "luxury car hire Nairobi",
    "SUV hire Nairobi",
    "safari car hire Kenya",
    "wedding car hire Nairobi",
    "Cosmara car hire",
    "airport car hire Nairobi",
    "JKIA car hire",
    "premium car hire Nairobi",
    "car rental Nairobi",
    "car hire Nairobi Kenya",
    "car hire Kenya",
    "car hire and tours Nairobi",
  ],
  metadataBase: new URL("https://cosmara.co.ke"),
  openGraph: {
    title: "Cosmara | Premium Car Hire in Nairobi",
    description:
      "Book premium cars in Nairobi. Executive, SUV, safari and wedding vehicles available.",
    url: "https://cosmara.co.ke",
    siteName: "Cosmara",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cosmara | Premium Car Hire in Nairobi",
    description: "Book premium cars in Nairobi, Kenya.",
  },
  robots: {
    index: true,
    follow: true,
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#D07D50",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  let isAdmin = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = data?.role === "admin";
  }
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SupabaseProvider>
          <Navbar initialUser={user} initialAdmin={isAdmin} />
          {children}
        </SupabaseProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
