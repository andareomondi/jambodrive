"use client";

import { useState } from "react";
import { Booking } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface EditBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

export function EditBookingModal({
  open,
  onOpenChange,
  booking,
}: EditBookingModalProps) {
  const supabase = createClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    pickupLocation: booking?.pickup_location || "",
    returnLocation: booking?.return_location || "",
  });

  if (!booking) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    if (!formData.pickupLocation || !formData.returnLocation) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          pickup_location: formData.pickupLocation,
          return_location: formData.returnLocation,
        })
        .eq("id", booking!.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Booking updated successfully");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>Modify your booking details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pickupLocation" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pickup Location
            </Label>
            <Input
              id="pickupLocation"
              name="pickupLocation"
              type="text"
              placeholder="e.g., Downtown Office, Airport Terminal"
              value={formData.pickupLocation}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnLocation" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Return Location
            </Label>
            <Input
              id="returnLocation"
              name="returnLocation"
              type="text"
              placeholder="e.g., Downtown Office, Airport Terminal"
              value={formData.returnLocation}
              onChange={handleChange}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={isProcessing}
            className="bg-accent hover:bg-accent/90"
          >
            {isProcessing ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
