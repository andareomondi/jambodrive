import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";
import { FloatingSupport } from "@/components/home/floating-support";
import AuthProvider from "@/components/auth/auth-provider";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

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

async function NavbarServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = data?.role ?? "customer";
  }

  return <Navbar initialUser={user} initialRole={role} />;
}

function NavbarSkeleton() {
  return (
    <div className="sticky top-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur-sm" />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense fallback={<NavbarSkeleton />}>
              <NavbarServer />
            </Suspense>
            {children}
            <FloatingSupport />
            <Footer />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
