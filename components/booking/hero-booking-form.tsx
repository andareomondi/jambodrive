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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-white/20 dark:border-slate-800/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          {/* Car Selection */}
          <div className="lg:col-span-1 group">
            <Label htmlFor="carId" className="text-xs font-bold text-foreground/80 uppercase tracking-widest mb-2.5 block">
              Car
            </Label>
            <select
              id="carId"
              {...register('carId', { required: true })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-foreground text-sm font-medium transition-all duration-300 hover:border-red-400 dark:hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 shadow-sm hover:shadow-md"
            >
              {uniqueCars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup Date */}
          <div className="lg:col-span-1 group">
            <Label htmlFor="pickupDate" className="text-xs font-bold text-foreground/80 uppercase tracking-widest mb-2.5 block">
              From
            </Label>
            <Input
              id="pickupDate"
              type="date"
              {...register('pickupDate', { required: true })}
              className={`text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-300 focus:ring-2 focus:ring-red-500/40 focus:border-red-500 hover:shadow-md ${
                errors.pickupDate ? 'border-red-500 focus:ring-red-500/60' : 'border-gray-300 dark:border-slate-700'
              }`}
            />
          </div>

          {/* Return Date */}
          <div className="lg:col-span-1 group">
            <Label htmlFor="returnDate" className="text-xs font-bold text-foreground/80 uppercase tracking-widest mb-2.5 block">
              To
            </Label>
            <Input
              id="returnDate"
              type="date"
              {...register('returnDate', { required: true })}
              className={`text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-300 focus:ring-2 focus:ring-red-500/40 focus:border-red-500 hover:shadow-md ${
                errors.returnDate ? 'border-red-500 focus:ring-red-500/60' : 'border-gray-300 dark:border-slate-700'
              }`}
            />
          </div>

          {/* Pickup Location */}
          <div className="lg:col-span-1 group">
            <Label htmlFor="pickupLocation" className="text-xs font-bold text-foreground/80 uppercase tracking-widest mb-2.5 block">
              Location
            </Label>
            <select
              id="pickupLocation"
              {...register('pickupLocation')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-foreground text-sm font-medium transition-all duration-300 hover:border-red-400 dark:hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 shadow-sm hover:shadow-md"
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
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900 font-bold uppercase text-sm tracking-widest rounded-lg transition-all duration-300 h-11 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              onClick={() => setUseWhatsApp(false)}
            >
              <Search className="w-4 h-4 mr-2" />
              Find Car
            </Button>
          </div>
        </div>

        {/* WhatsApp Alternative */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-200 dark:border-slate-700/50">
          <p className="text-xs text-muted-foreground/70 font-medium">
            Prefer direct messaging?
          </p>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 font-bold text-xs uppercase tracking-wide transition-all duration-300 hover:scale-105"
            onClick={() => setUseWhatsApp(true)}
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            WhatsApp
          </Button>
        </div>
      </div>
    </form>
  )
}
