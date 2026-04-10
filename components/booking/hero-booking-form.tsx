'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { mockCars } from '@/lib/mock-data'

interface QuickBookingData {
  carId: string
  pickupDate: string
  returnDate: string
  pickupLocation: string
}

interface HeroBookingFormProps {
  onSuccess?: (data: QuickBookingData) => void
}

export function HeroBookingForm({ onSuccess }: HeroBookingFormProps) {
  const router = useRouter()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<QuickBookingData>({
    defaultValues: {
      carId: mockCars[0]?.id || '',
      pickupLocation: 'downtown',
    },
  })

  const [useWhatsApp, setUseWhatsApp] = useState(false)
  const formData = watch()

  const locations = [
    { id: 'downtown', name: 'Downtown' },
    { id: 'airport', name: 'Airport' },
    { id: 'waterfront', name: 'Waterfront' },
  ]

  // Group cars by name for dropdown
  const uniqueCars = Array.from(
    new Map(mockCars.map((car) => [car.name, car])).values()
  )

  const generateWhatsAppMessage = (data: QuickBookingData) => {
    const car = mockCars.find((c) => c.id === data.carId)
    const message = `Hi! I'd like to book a car:\n\n🚗 Car: ${car?.name || 'Not specified'}\n📅 Pickup: ${data.pickupDate}\n📅 Return: ${data.returnDate}\n📍 Location: ${data.pickupLocation}`
    return encodeURIComponent(message)
  }

  const onSubmit = (data: QuickBookingData) => {
    if (!data.pickupDate || !data.returnDate) {
      toast.error('Please select both dates')
      return
    }

    if (new Date(data.pickupDate) >= new Date(data.returnDate)) {
      toast.error('Return date must be after pickup date')
      return
    }

    if (useWhatsApp) {
      const whatsappNumber = '254700000000' // Replace with your WhatsApp business number
      const message = generateWhatsAppMessage(data)
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`
      window.open(whatsappURL, '_blank')
      toast.success('Opening WhatsApp...')
      setUseWhatsApp(false)
    } else {
      // Navigate to car detail page with booking params
      const queryParams = new URLSearchParams({
        from: data.pickupDate,
        to: data.returnDate,
        location: data.pickupLocation,
      }).toString()
      router.push(`/cars/${data.carId}?${queryParams}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Car Selection */}
          <div className="lg:col-span-1">
            <Label htmlFor="carId" className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 block">
              Select Car
            </Label>
            <select
              id="carId"
              {...register('carId', { required: true })}
              className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm font-medium transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              {uniqueCars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup Date */}
          <div className="lg:col-span-1">
            <Label htmlFor="pickupDate" className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 block">
              From
            </Label>
            <Input
              id="pickupDate"
              type="date"
              {...register('pickupDate', { required: true })}
              className={`text-sm font-medium ${
                errors.pickupDate ? 'border-red-500' : ''
              }`}
            />
          </div>

          {/* Return Date */}
          <div className="lg:col-span-1">
            <Label htmlFor="returnDate" className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 block">
              To
            </Label>
            <Input
              id="returnDate"
              type="date"
              {...register('returnDate', { required: true })}
              className={`text-sm font-medium ${
                errors.returnDate ? 'border-red-500' : ''
              }`}
            />
          </div>

          {/* Pickup Location */}
          <div className="lg:col-span-1">
            <Label htmlFor="pickupLocation" className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 block">
              Location
            </Label>
            <select
              id="pickupLocation"
              {...register('pickupLocation')}
              className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm font-medium transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <div className="lg:col-span-1 flex items-end">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold uppercase text-sm tracking-wide rounded-lg transition-all duration-200 h-10 flex items-center justify-center"
              onClick={() => setUseWhatsApp(false)}
            >
              <Search className="w-4 h-4 mr-2" />
              Find Car
            </Button>
          </div>
        </div>

        {/* WhatsApp Alternative */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-muted-foreground">
            Prefer direct messaging?
          </p>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="text-green-600 dark:text-green-400 font-semibold text-xs"
            onClick={() => setUseWhatsApp(true)}
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Chat on WhatsApp
          </Button>
        </div>
      </div>
    </form>
  )
}
