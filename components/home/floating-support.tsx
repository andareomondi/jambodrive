"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpSupportModal } from "@/components/modals/help-support-modal";

export function FloatingSupport() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setHelpModalOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-2xl hover:scale-110 transition-all z-50 ring-4 ring-orange-600/20"
        size="icon"
        aria-label="Open support"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      <HelpSupportModal open={helpModalOpen} onOpenChange={setHelpModalOpen} />
    </>
  );
}
