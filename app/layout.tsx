import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";
import { FloatingSupport } from "@/components/home/floating-support";
import AuthProvider from "@/components/auth/auth-provider";

// export const dynamic = "force-dynamic";

const manrope = Manrope({
  variable: "--font-manrope",
  display: "swap",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Affordable Car Hire in Nairobi & Kenya | Cosmara",
    template: "%s | Cosmara Car Hire",
  },
  description:
    "Affordable car hire in Nairobi and across Kenya. Compare economy cars, SUVs and premium vehicles, view daily rates, and book online. JKIA airport pickups available.",
  keywords: [
    "car hire Nairobi",
    "car rental Kenya",
    "affordable car hire Nairobi",
    "cheap car hire Nairobi",
    "affordable car rental Kenya",
    "low cost car hire Nairobi",
    "luxury car hire Nairobi",
    "premium car rental Kenya",
    "SUV hire Nairobi",
    "economy car hire Nairobi",
    "safari car hire Kenya",
    "wedding car hire Nairobi",
    "Cosmara car hire",
    "airport pickup Nairobi",
    "JKIA airport transfer",
    "airport transfer Nairobi",
    "JKIA car hire",
    "premium car hire Nairobi",
    "car rental Nairobi",
    "car hire Nairobi Kenya",
    "car hire Kenya",
  ],
  metadataBase: new URL("https://cosmara.co.ke"),
  openGraph: {
    title: "Affordable Car Hire in Nairobi & Kenya | Cosmara",
    description:
      "Find the right car for your budget and journey. Book car hire in Nairobi, Kenya, or arrange a convenient airport pickup with Cosmara.",
    url: "https://cosmara.co.ke",
    siteName: "Cosmara",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Affordable Car Hire in Nairobi & Kenya | Cosmara",
    description:
      "Explore economy, SUV and premium car rentals, plus airport pickups in Nairobi, Kenya.",
    images: ["/hero/car1.webp"],
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
      <body className={`${manrope.variable} ${cormorant.variable} font-sans antialiased min-h-screen`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AutoRental",
              "@id": "https://cosmara.co.ke/#business",
              name: "Cosmara Car Hire",
              url: "https://cosmara.co.ke",
              logo: "https://cosmara.co.ke/logo.ico",
              image: "https://cosmara.co.ke/hero/car1.webp",
              description:
                "Car hire and airport pickup services in Nairobi and across Kenya, with economy, SUV and premium vehicle options.",
              telephone: "+254758500943",
              email: "cosmaragroup@gmail.com",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Nairobi",
                addressCountry: "KE",
              },
              areaServed: [
                { "@type": "City", name: "Nairobi" },
                { "@type": "Country", name: "Kenya" },
              ],
              currenciesAccepted: "KES",
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Transport services",
                itemListElement: [
                  {
                    "@type": "OfferCatalog",
                    name: "Car rental",
                    itemListElement: [
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "Economy car hire in Nairobi",
                        },
                      },
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "SUV and premium car hire in Kenya",
                        },
                      },
                    ],
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Airport pickup and transfer in Nairobi",
                      areaServed: "Nairobi, Kenya",
                    },
                  },
                ],
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
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
