"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteCar } from "@/lib/actions/admin";
import { deleteCarImages } from "@/lib/upload-image";

interface DeleteCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  carId: string | null;
  carName: string;
  imageUrls: string[];
}

export function DeleteCarModal({
  isOpen, onClose, onSuccess, carId, carName, imageUrls,
}: DeleteCarModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<"idle" | "db" | "storage" | "done">("idle");

  const stepLabel: Record<typeof step, string> = {
    idle:    "Delete Car",
    db:      "Removing record...",
    storage: "Deleting images...",
    done:    "Done",
  };

  const handleDelete = async () => {
    if (!carId) return;
    setIsDeleting(true);

    try {
      // 1. Delete DB record (cascade handles booking FK)
      setStep("db");
      await adminDeleteCar(carId);

      // 2. Bulk delete all images in one storage call
      setStep("storage");
      if (imageUrls.length > 0) {
        await deleteCarImages(imageUrls).catch((err) => {
          // Storage cleanup failing shouldn't block the user
          console.error("Image cleanup partial failure:", err);
        });
      }

      setStep("done");
      toast.success(`${carName} removed permanently.`);

      setTimeout(() => {
        onSuccess();
        onClose();
        setIsDeleting(false);
        setStep("idle");
      }, 400);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete car");
      setIsDeleting(false);
      setStep("idle");
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(next) => { if (!isDeleting) { onClose(); setStep("idle"); } }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[425px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {!isDeleting && (
            <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" /><span className="sr-only">Close</span>
            </Dialog.Close>
          )}

          {/* Icon */}
          <div className="flex flex-col items-center text-center space-y-4 mb-6">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <Dialog.Title className="text-xl font-bold text-foreground">
                Delete Vehicle?
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">{carName}</span>?
                This will permanently remove the record and all hosted images.
              </Dialog.Description>
            </div>
          </div>

          {/* Progress indicator — simple text, no Progress component needed */}
          {isDeleting && (
            <div className="mb-6 rounded-xl bg-muted/40 border border-border p-4 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-accent shrink-0" />
              <p className="text-sm text-muted-foreground">
                {step === "db"      && "Removing database record..."}
                {step === "storage" && `Deleting ${imageUrls.length} image${imageUrls.length !== 1 ? "s" : ""}...`}
                {step === "done"    && "Complete."}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isDeleting} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {stepLabel[step]}</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" /> Delete Car</>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
