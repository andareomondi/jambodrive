'use client'

import { useState } from 'react'
import { Booking } from '@/lib/mock-data'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface EditBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking | null
}

export function EditBookingModal({ open, onOpenChange, booking }: EditBookingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    pickupDate: booking?.pickupDate || '',
    returnDate: booking?.returnDate || '',
    pickupLocation: booking?.pickupLocation || '',
    returnLocation: booking?.returnLocation || '',
  })

  if (!booking) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveChanges = async () => {
    if (!formData.pickupDate || !formData.returnDate || !formData.pickupLocation || !formData.returnLocation) {
      toast.error('Please fill in all fields')
      return
    }

    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Booking updated successfully')
      onOpenChange(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Modify your booking details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pickup Date */}
          <div className="space-y-2">
            <Label htmlFor="pickupDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Pickup Date
            </Label>
            <Input
              id="pickupDate"
              name="pickupDate"
              type="date"
              value={formData.pickupDate}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          {/* Return Date */}
          <div className="space-y-2">
            <Label htmlFor="returnDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Return Date
            </Label>
            <Input
              id="returnDate"
              name="returnDate"
              type="date"
              value={formData.returnDate}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          {/* Pickup Location */}
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

          {/* Return Location */}
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
            {isProcessing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
