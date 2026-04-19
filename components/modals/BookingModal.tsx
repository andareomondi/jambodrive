'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Car, User, MapPin, DollarSign, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface BookingFormData {
  car_id: string
  profile_id: string | null
  pickup_date: string
  return_date: string
  pickup_location: string
  return_location: string
  total_price: number
  insurance: boolean
}

export function BookingModal({ open, onOpenChange, onSuccess }: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  onSuccess: () => void 
}) {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [availableCars, setAvailableCars] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])

  const { register, handleSubmit, control, reset, watch } = useForm<BookingFormData>({
    defaultValues: {
      insurance: false,
      profile_id: null,
      pickup_location: 'Main Office',
      return_location: 'Main Office'
    }
  })

  // Fetch Cars (where available = true) and Profiles
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const [carsRes, profilesRes] = await Promise.all([
          supabase.from('cars').select('id, name, model, price').eq('available', true),
          supabase.from('profiles').select('id, full_name, email')
        ])
        if (carsRes.data) setAvailableCars(carsRes.data)
        if (profilesRes.data) setProfiles(profilesRes.data)
      }
      fetchData()
    } else {
      reset()
    }
  }, [open, supabase, reset])

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true)
    try {
      // 1. Create the booking record
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          ...data,
          profile_id: data.profile_id === "none" ? null : data.profile_id,
          status: 'confirmed' // Admin bookings usually skip 'pending'
        }])

      if (bookingError) throw bookingError

      // 2. Mark the car as rented (available = false)
      const { error: carError } = await supabase
        .from('cars')
        .update({ available: false })
        .eq('id', data.car_id)

      if (carError) throw carError

      toast.success("Booking created and car status updated.")
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to create booking")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Create Manual Booking
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Car Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">Select Vehicle</Label>
            <Controller name="car_id" control={control} required render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11">
                  <SelectValue placeholder="Choose an available car" />
                </SelectTrigger>
                <SelectContent>
                  {availableCars.map(car => (
                    <SelectItem key={car.id} value={car.id}>
                      {car.name} {car.model} — KES {car.price}/day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>

          {/* Customer Selection (Optional) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">Customer Profile (Optional)</Label>
            <Controller name="profile_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || "none"}>
                <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11">
                  <SelectValue placeholder="Select existing user or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Walk-in Customer (No Account)</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Pickup Date</Label>
              <Input type="date" {...register('pickup_date', { required: true })} className="rounded-xl bg-slate-50 border-none h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Return Date</Label>
              <Input type="date" {...register('return_date', { required: true })} className="rounded-xl bg-slate-50 border-none h-11" />
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Pickup Location</Label>
              <Input {...register('pickup_location')} className="rounded-xl bg-slate-50 border-none h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Return Location</Label>
              <Input {...register('return_location')} className="rounded-xl bg-slate-50 border-none h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">Total Price (KES)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="number" {...register('total_price', { required: true })} className="pl-9 rounded-xl bg-slate-50 border-none h-11" />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="rounded-xl h-12 flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading} className="bg-accent hover:bg-accent/90 text-white rounded-xl h-12 flex-[2] font-bold shadow-lg shadow-accent/20">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
