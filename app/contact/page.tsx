import { Metadata } from "next";
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
                  info: "+2547 585 009431",
                  subtext: "Available 9 AM - 9 PM EAT",
                },
                {
                  icon: Mail,
                  title: "Email",
                  info: "team@cosmara.co.ke",
                  subtext: "Response within 24 hours",
                },
                {
                  icon: MapPin,
                  title: "Office",
                  info: "Nairobi, Kenya",
                  subtext: "Visit us during business hours",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={i}
                    className="p-6 shadow-sm hover:shadow-md transition-shadow border-border"
                  >
                    <Icon className="h-8 w-8 text-accent mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-foreground font-medium mb-1">
                      {item.info}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.subtext}
                    </p>
                  </Card>
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
