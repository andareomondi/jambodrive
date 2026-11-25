import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
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
    "Book affordable car hire in Nairobi, request a wedding transport quote, or arrange a Nairobi airport pickup with an upfront fare. Explore available vehicles and pay securely with M-Pesa.",
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
    "wedding transport Kenya",
    "wedding transport quote Nairobi",
    "wedding cars Nairobi",
    "Cosmara car hire",
    "airport pickup Nairobi",
    "airport pickup Kenya",
    "JKIA airport transfer",
    "airport transfer Nairobi",
    "Nairobi airport transfer booking",
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
      "Find a car for your journey, request tailored wedding transport in Nairobi, or book an airport pickup with an upfront fare and secure M-Pesa payment.",
    url: "https://cosmara.co.ke",
    siteName: "Cosmara",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Affordable Car Hire in Nairobi & Kenya | Cosmara",
    description:
      "Explore car hire, Nairobi airport pickups and tailored wedding transport enquiries with Cosmara.",
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
  themeColor: "#D07D50",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${cormorant.variable} font-sans antialiased min-h-screen`}
      >
        <Script id="gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WRQ2CX3F');
          `}
        </Script>

        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WRQ2CX3F"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

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
                "Car hire, Nairobi airport pickups and wedding transport planning in Nairobi and across Kenya, with economy, SUV and premium vehicle options.",
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
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Wedding transport planning and vehicle quotes",
                      areaServed: "Nairobi, Kenya",
                      url: "https://cosmara.co.ke/wedding-events",
                    },
                  },
                ],
              },
            }).replace(/</g, "\\u003c"),
          }}
        />

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Navbar />
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
