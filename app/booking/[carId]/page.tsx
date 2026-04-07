'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { BookingForm, BookingFormData } from '@/components/booking/booking-form'
import { BookingSummary } from '@/components/booking/booking-summary'
import { EmptyState } from '@/components/common/empty-state'
import { mockCars } from '@/lib/mock-data'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function BookingPage() {
  const params = useParams()
  const carId = params.carId as string
  const car = mockCars.find((c) => c.id === carId)
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [insurance, setInsurance] = useState(false)
  const [addOns, setAddOns] = useState<string[]>([])

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Car Not Found"
            description="The car you&apos;re trying to book doesn&apos;t exist."
            action={{ label: 'Back to Cars', href: '/cars' }}
          />
        </div>
        <Footer />
      </div>
    )
  }

  if (!car.available) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Car Not Available"
            description={`The ${car.name} is currently unavailable for booking. Please choose another vehicle.`}
            action={{ label: 'Browse Other Cars', href: '/cars' }}
          />
        </div>
        <Footer />
      </div>
    )
  }

  const handleBooking = async (data: BookingFormData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Set the booking data to show confirmation
      setBookingData(data)
      setPickupDate(data.pickupDate)
      setReturnDate(data.returnDate)
      setInsurance(data.insurance)
      setAddOns(data.additionalFeatures)

      toast.success('Booking confirmed! A confirmation email has been sent.')

      // Scroll to confirmation
      setTimeout(() => {
        const confirmationElement = document.getElementById('booking-confirmation')
        if (confirmationElement) {
          confirmationElement.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } catch (error) {
      toast.error('Failed to confirm booking. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (bookingData) {
    const days = Math.ceil(
      (new Date(bookingData.returnDate).getTime() - new Date(bookingData.pickupDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    const subtotal = days * car.price
    const insurancePrice = bookingData.insurance ? days * 25 : 0
    const addOnsPrice = bookingData.additionalFeatures.length * 50
    const total = subtotal + insurancePrice + addOnsPrice

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/cars" className="inline-flex items-center text-accent hover:text-accent/80 mb-8 transition-colors">
            ← Back to Cars
          </Link>

          <div id="booking-confirmation">
            <Card className="p-8 shadow-medium bg-gradient-to-br from-background to-secondary">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-center text-foreground mb-2">Booking Confirmed!</h1>
              <p className="text-center text-muted-foreground mb-8">
                Your reservation for {car.name} has been confirmed.
              </p>

              {/* Confirmation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-background rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Confirmation Number</p>
                  <p className="text-lg font-semibold text-foreground">BK{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                  <p className="text-lg font-semibold text-foreground">{car.name} {car.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pickup Date</p>
                  <p className="text-lg font-semibold text-foreground">{bookingData.pickupDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Return Date</p>
                  <p className="text-lg font-semibold text-foreground">{bookingData.returnDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pickup Location</p>
                  <p className="text-lg font-semibold text-foreground capitalize">{bookingData.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Guest Name</p>
                  <p className="text-lg font-semibold text-foreground">
                    {bookingData.firstName} {bookingData.lastName}
                  </p>
                </div>
              </div>

              {/* Price Summary */}
              <div className="p-6 bg-secondary rounded-lg mb-8">
                <h3 className="font-semibold text-foreground mb-4">Price Summary</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">${car.price} × {days} days</span>
                    <span className="text-foreground font-medium">${subtotal}</span>
                  </div>
                  {bookingData.insurance && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Insurance</span>
                      <span className="text-foreground font-medium">${insurancePrice}</span>
                    </div>
                  )}
                  {bookingData.additionalFeatures.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Add-ons</span>
                      <span className="text-foreground font-medium">${addOnsPrice}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-accent">${total}</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mb-6">
                A confirmation email has been sent to {bookingData.email}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-md font-medium text-center hover:bg-accent/90 transition-colors"
                >
                  View Booking in Dashboard
                </Link>
                <Link
                  href="/cars"
                  className="flex-1 px-6 py-3 border border-border rounded-md font-medium text-center hover:bg-secondary transition-colors"
                >
                  Browse More Cars
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <Link href={`/cars/${car.id}`} className="inline-flex items-center text-accent hover:text-accent/80 mb-8 transition-colors">
          ← Back to Car
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">Complete Your Booking</h1>
        <p className="text-muted-foreground mb-8">Review the details and confirm your reservation for {car.name}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <BookingForm carName={car.name} onSubmit={handleBooking} isLoading={isLoading} />
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <BookingSummary car={car} pickupDate={pickupDate} returnDate={returnDate} insurance={insurance} addOns={addOns} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
