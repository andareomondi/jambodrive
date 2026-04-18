'use client'

import { Booking, mockCars } from '@/lib/mock-data'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Calendar, MapPin, DollarSign, CheckCircle, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-client'
import { DatabaseService } from '@/lib/services'
import { useState, useEffect } from 'react'

interface BookingSummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking | null
}

export function BookingSummaryModal({ open, onOpenChange, booking }: BookingSummaryModalProps) {
  const db = new DatabaseService(createClient())
  const [car, setCar] = useState<Car | null>(null)

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const carData = await db.getCarById(booking.car_id)
        setCar(carData)
      } catch (err) {
        console.error('Error fetching car data:', err)
      }
    }

    if (booking) {
      fetchCar()
    }
  }, [booking])

  if (!booking) return null

  // Calculate total days
  const pickupDate = new Date(booking.pickup_date)
  const returnDate = new Date(booking.return_date)
  const totalDays = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24))

  const handleDownloadReceipt = () => {
    toast.success('Receipt downloaded successfully')
  }

  const handleShare = () => {
    toast.success('Booking details copied to clipboard')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm md:max-w-2xl mx-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-2xl">Booking Summary</DialogTitle>
          <DialogDescription>
            View your completed booking details and receipt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Booking Status Banner */}
          <div className="flex gap-3 items-start p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm md:text-base text-blue-900">Booking Completed</p>
              <p className="text-xs md:text-sm text-blue-800">
                Thank you for choosing JamboDrive
              </p>
            </div>
          </div>

          {/* Booking ID and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="text-xs md:text-sm text-muted-foreground">Booking ID</label>
              <p className="font-medium text-sm md:text-base text-foreground font-mono">{booking.id}</p>
            </div>
            <div className="flex flex-col">
              <label className="text-xs md:text-sm text-muted-foreground">Status</label>
              <Badge className="mt-1 capitalize text-xs md:text-sm bg-black">
                {booking.status}
              </Badge>
            </div>
          </div>

          {/* Vehicle Information */}
          <Card className="p-3 md:p-4 bg-muted/50">
                     <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {car ? (
                  <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
              </div>

              <p className="font-medium text-sm md:text-base text-foreground">{car?.name}</p>
              {car && <p className="text-xs md:text-sm text-muted-foreground">{car.model} • ${car.price}/day</p>}
            </div>
          </Card>

          {/* Rental Dates and Locations */}
          <div className="space-y-2 md:space-y-3">
            <div className="flex gap-2 md:gap-3 items-start">
              <Calendar className="h-4 md:h-5 w-4 md:w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs md:text-sm text-muted-foreground">Pickup Date & Location</p>
                <p className="font-medium text-sm md:text-base text-foreground">{new Date(booking.pickup_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{booking.pickup_location}</p>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 items-start">
              <Calendar className="h-4 md:h-5 w-4 md:w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs md:text-sm text-muted-foreground">Return Date & Location</p>
                <p className="font-medium text-sm md:text-base text-foreground">{new Date(booking.return_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{booking.return_location}</p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <Card className="p-3 md:p-4 border border-accent/20 bg-accent/5">
            <h3 className="font-semibold text-sm md:text-base text-foreground mb-2 md:mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent" />
              Payment Summary
            </h3>
            <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Rate:</span>
                <span className="font-medium text-foreground">${car?.price || 0}/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Days:</span>
                <span className="font-medium text-foreground">{totalDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-foreground">${(car?.price || 0) * totalDays}</span>
              </div>
              {booking.insurance && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance Coverage:</span>
                  <span className="font-medium text-foreground">Included</span>
                </div>
              )}
              {booking.additional_features.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-ons:</span>
                  <span className="font-medium text-foreground">${Math.round(booking.total_price * 0.1)}</span>
                </div>
              )}
              <div className="border-t border-accent/20 pt-1 md:pt-2 mt-1 md:mt-2 flex justify-between">
                <span className="font-semibold text-foreground">Total Amount Paid:</span>
                <span className="font-bold text-accent text-base md:text-lg">${booking.total_price}</span>
              </div>
            </div>
          </Card>

          {/* Additional Features */}
          {booking.additional_features.length > 0 && (
            <div>
              <label className="text-xs md:text-sm text-muted-foreground block mb-2">Additional Services</label>
              <div className="flex flex-wrap gap-2">
                {booking.additional_features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs md:text-sm">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse md:flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleShare}
            className="w-full md:w-auto text-xs md:text-sm"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={handleDownloadReceipt}
            className="w-full md:w-auto bg-accent hover:bg-accent/90 text-xs md:text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

