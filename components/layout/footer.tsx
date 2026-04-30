import Link from "next/link";
import { Car, Mail, Phone, MapPin } from "lucide-react";
import BackgroundSlider from "react-background-slider";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-6 h-6 text-accent" />
              <span className="font-bold text-lg text-foreground">
                Cosmara
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Premium car rental service offering luxury and affordable vehicles
              for your journey.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/cars"
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Browse Cars
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/faq"
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2 items-start text-muted-foreground">
                <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>+254 758 5009431</span>
              </li>
              <li className="flex gap-2 items-start text-muted-foreground">
                <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>cozymaxm@gmail.com</span>
              </li>
              <li className="flex gap-2 items-start text-muted-foreground">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {currentYear} Cosmara. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-accent transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
