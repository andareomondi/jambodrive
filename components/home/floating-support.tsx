"use client";

import { useState } from "react";
import { HelpCircle, X, MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";

const CONTACT_OPTIONS = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    description: "Chat with us instantly",
    href: "https://wa.me/254758500943",
    external: true,
  },
  {
    icon: Phone,
    label: "Call Us",
    description: "+254 758 500943",
    href: "tel:+254758500943",
    external: false,
  },
  {
    icon: Mail,
    label: "Email",
    description: "team@cosmara.co.ke",
    href: "mailto:team@cosmara.co.ke",
    external: false,
  },
] as const;

export function FloatingSupport() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <Dialog.Trigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full shadow-2xl hover:scale-110 transition-all z-50 ring-4 ring-accent/20"
          size="icon"
          aria-label="Open support"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <Dialog.Title className="font-semibold text-foreground">
                Need help?
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                We're available 24/7
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          {/* Contact options */}
          <div className="p-3 space-y-1.5">
            {CONTACT_OPTIONS.map(
              ({ icon: Icon, label, description, href, external }) => {
                const isWhatsApp = label === "WhatsApp";

                return (
                  <a
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors group ${
                      isWhatsApp
                        ? "bg-[#25D366] hover:bg-[#128C7E]"
                        : "hover:bg-accent/10"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isWhatsApp
                          ? "bg-white/20 group-hover:bg-white/30"
                          : "bg-accent/10 group-hover:bg-accent/20"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isWhatsApp ? "text-white" : "text-accent"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isWhatsApp ? "text-white" : "text-foreground"
                        }`}
                      >
                        {label}
                      </p>
                      <p
                        className={`text-xs ${
                          isWhatsApp ? "text-white/90" : "text-muted-foreground"
                        }`}
                      >
                        {description}
                      </p>
                    </div>
                  </a>
                );
              },
            )}
          </div>
          {/* Footer note */}
          <div className="px-5 pb-4">
            <p className="text-xs text-muted-foreground text-center">
              Average response time: under 5 minutes
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
