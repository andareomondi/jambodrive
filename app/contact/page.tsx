import { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import ContactForm from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us | Cosmara Car Rental",
  description:
    "Get in touch with the Cosmara support team. Reach out via phone, email, or our office location in Nairobi, Kenya for any car rental inquiries.",
  openGraph: {
    title: "Contact Us | Cosmara",
    description:
      "Have questions about Cosmara? Contact our support team today.",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-secondary/50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Get in Touch with Us
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl text-balance">
              Have questions about Cosmara? We&apos;re here to help. Contact our
              support team and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Contact Info Cards */}
              {[
                {
                  icon: Phone,
                  title: "Phone",
                  info: "+2547 585 00943",
                  subtext: "Available 9 AM - 9 PM EAT",
                  href: "tel:+254758500943",
                },
                {
                  icon: Mail,
                  title: "Email",
                  info: "cosmaragroup@gmail.com",
                  subtext: "Response within 24 hours",
                  href: "mailto:cosmaragroup@gmail.com",
                },
                {
                  icon: MapPin,
                  title: "Office",
                  info: "Nairobi, Kenya",
                  subtext: "Visit us during business hours",
                  href: "https://maps.app.goo.gl/tsi4RBUgc1aoBGn58",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={i}
                    href={item.href}
                    className="block group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl transition-all"
                  >
                    <Card className="p-6 h-full shadow-sm hover:shadow-md transition-all duration-200 border-border cursor-pointer group-hover:border-accent/50 group-hover:bg-accent/5 active:scale-[0.99]">
                      <Icon className="h-8 w-8 text-accent mb-4 transition-transform group-hover:scale-110 duration-200" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-foreground font-medium mb-1 group-hover:text-accent transition-colors">
                        {item.info}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.subtext}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Client Interactive Contact Form */}
            <div className="max-w-2xl mx-auto">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
