import Image from 'next/image'
import { Car } from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface BookingSummaryProps {
  car: Car
  pickupDate?: string
  returnDate?: string
  insurance: boolean
  addOns: string[]
}

export function BookingSummary({ car, pickupDate, returnDate, insurance, addOns }: BookingSummaryProps) {
  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 0
    const pickup = new Date(pickupDate)
    const returnD = new Date(returnDate)
    return Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24))
  }

  const days = calculateDays()
  const dailyRate = car.price
  const subtotal = days * dailyRate
  const insurancePrice = insurance ? days * 25 : 0
  const addOnsPrice = addOns.length * 50
  const total = subtotal + insurancePrice + addOnsPrice

  return (
    <Card className="p-6 shadow-md sticky top-32">
      <h3 className="font-semibold text-lg text-foreground mb-4">Booking Summary</h3>

      {/* Car Info */}
      <div className="flex gap-3 mb-6 pb-6 border-b border-border">
        <div className="relative h-20 w-24 rounded-md overflow-hidden flex-shrink-0">
          <Image src={car.image} alt={car.name} fill className="object-cover" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{car.name}</p>
          <p className="text-sm text-muted-foreground">{car.model}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-accent text-accent" />
            <span className="text-xs text-foreground">{car.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Dates */}
      {days > 0 && (
        <>
          <div className="space-y-2 mb-4 pb-4 border-b border-border text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pickup</span>
              <span className="text-foreground font-medium">{pickupDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Return</span>
              <span className="text-foreground font-medium">{returnDate}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Duration</span>
              <span className="text-foreground font-medium">{days} day(s)</span>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 text-sm mb-4 pb-4 border-b border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                ${dailyRate} × {days} days
              </span>
              <span className="text-foreground font-medium">${subtotal}</span>
            </div>
            {insurance && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance</span>
                <span className="text-foreground font-medium">${insurancePrice}</span>
              </div>
            )}
            {addOns.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add-ons ({addOns.length})</span>
                <span className="text-foreground font-medium">${addOnsPrice}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center mb-6">
            <span className="font-semibold text-foreground">Total Price</span>
            <span className="text-2xl font-bold text-accent">${total}</span>
          </div>
        </>
      )}

      <div className="text-xs text-muted-foreground text-center">
        {days === 0
          ? 'Select pickup and return dates to see pricing'
          : `Total for ${days} day${days !== 1 ? 's' : ''}`}
      </div>
    </Card>
  )
}
