'use client'

import { useState, useEffect } from 'react'
import { Booking, mockCars } from '@/lib/mock-data'
import { EditBookingModal } from './edit-booking-modal'
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
import { Calendar, MapPin, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-client'
import { DatabaseService } from '@/lib/services'
import { useMemo } from 'react'

interface ManageBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking | null
}

export function ManageBookingModal({ open, onOpenChange, booking }: ManageBookingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
const supabase = useMemo(() => createClient(), [])
  const db = useMemo(() => new DatabaseService(supabase), [supabase])
  const [car, setCar] = useState<Car | null>(null)


useEffect(() => {
    const fetchCar = async () => {
      if (!booking) return 

      try {
        const carData = db.getCarById(booking.car_id)
        setCar(carData)
      } catch (err) {
        console.error('Error fetching car data:', err)
      }
    }

    fetchCar()
  }, [booking, db]) 

  if (!booking) return null

  const today = new Date()
  const pickupDate = new Date(booking.pickupDate)
  const returnDate = new Date(booking.returnDate)
  const isActive = today >= pickupDate && today <= returnDate

  // Calculate running cost for active bookings
  let runningCost = 0
  if (isActive && car) {
    const daysElapsed = Math.floor((today.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    runningCost = daysElapsed * car.price
  }

  // Calculate total days
  const totalDays = Math.floor((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const handleModifyBooking = () => {
    setEditModalOpen(true)
  }

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return
    }
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Booking cancelled successfully')
      onOpenChange(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExtendBooking = async () => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Booking extension initiated')
      onOpenChange(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-sm md:max-w-2xl mx-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>Manage Booking</DialogTitle>
          <DialogDescription>
            View and manage your booking details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Booking Status Banner */}
          {isActive && (
            <div className="flex gap-3 items-start p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm md:text-base text-green-900">Booking Active</p>
                <p className="text-xs md:text-sm text-green-800">
                  Your booking is currently active. Running cost is being calculated daily.
                </p>
              </div>
            </div>
          )}

          {/* Booking Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="text-xs md:text-sm text-muted-foreground">Booking ID</label>
              <p className="font-medium text-sm md:text-base text-foreground">{booking.id}</p>
            </div>
            <div className="flex flex-col">
              <label className="text-xs md:text-sm text-muted-foreground">Status</label>
              <Badge className="mt-1 capitalize text-xs md:text-sm">{booking.status}</Badge>
            </div>
          </div>

          {/* Vehicle Details */}
          <Card className="p-3 md:p-4 bg-muted/50">
            <h3 className="font-semibold text-sm md:text-base text-foreground mb-2 md:mb-3">Vehicle</h3>
            <div>
              <p className="font-medium text-sm md:text-base text-foreground">{booking.car?.name}</p>
              {car && <p className="text-xs md:text-sm text-muted-foreground">{car.model} • ${car.price}/day</p>}
            </div>
          </Card>

          {/* Dates and Locations */}
          <div className="space-y-2 md:space-y-3">
            <div className="flex gap-2 md:gap-3 items-start">
              <Calendar className="h-4 md:h-5 w-4 md:w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs md:text-sm text-muted-foreground">Pickup</p>
                <p className="font-medium text-sm md:text-base text-foreground">{booking.pickupDate}</p>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 items-start">
              <Calendar className="h-4 md:h-5 w-4 md:w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs md:text-sm text-muted-foreground">Return</p>
                <p className="font-medium text-sm md:text-base text-foreground">{booking.returnDate}</p>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 items-start">
              <MapPin className="h-4 md:h-5 w-4 md:w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs md:text-sm text-muted-foreground">Pickup Location</p>
                <p className="font-medium text-sm md:text-base text-foreground">{booking.pickupLocation}</p>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 items-start">
              <MapPin className="h-4 md:h-5 w-4 md:w-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs md:text-sm text-muted-foreground">Return Location</p>
                <p className="font-medium text-sm md:text-base text-foreground">{booking.returnLocation}</p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <Card className="p-3 md:p-4 border border-accent/20 bg-accent/5">
            <h3 className="font-semibold text-sm md:text-base text-foreground mb-2 md:mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent" />
              Cost Details
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
              {booking.insurance && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance:</span>
                  <span className="font-medium text-foreground">Included</span>
                </div>
              )}
              <div className="border-t border-accent/20 pt-1 md:pt-2 mt-1 md:mt-2 flex justify-between">
                <span className="font-semibold text-foreground">Total Price:</span>
                <span className="font-bold text-accent">${booking.totalPrice}</span>
              </div>
              {isActive && (
                <div className="border-t border-green-200 pt-1 md:pt-2 mt-1 md:mt-2 flex justify-between bg-green-50 p-2 -mx-3 md:-mx-4 -mb-3 md:-mb-4 rounded">
                  <span className="font-semibold text-green-900">Running Cost:</span>
                  <span className="font-bold text-green-600">${runningCost}</span>
                </div>
              )}
            </div>
          </Card>

                  </div>

        <DialogFooter className="flex flex-col-reverse md:flex-row gap-2 justify-end">
          {isActive ? (
            <>
              <Button
                variant="outline"
                onClick={handleExtendBooking}
                disabled={isProcessing}
                className="w-full md:w-auto text-xs md:text-sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Extend
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelBooking}
                disabled={isProcessing}
                className="w-full md:w-auto text-xs md:text-sm"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full md:w-auto text-xs md:text-sm"
              >
                Close
              </Button>
              <Button
                onClick={handleModifyBooking}
                disabled={booking.status === 'confirmed'}
                className={`w-full md:w-auto text-xs md:text-sm ${
                  booking.status === 'confirmed'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-accent hover:bg-accent/90'
                }`}
              >
                {booking.status === 'confirmed' ? 'Cannot Modify' : 'Modify Booking'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      </Dialog>

      {/* Edit Booking Modal */}
      <EditBookingModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        booking={booking}
      />
    </>
  )
}
