'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldGroup, FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'

interface BookingFormProps {
  carName: string
  onSubmit: (data: BookingFormData) => void
  isLoading?: boolean
}

export interface BookingFormData {
  pickupDate: string
  returnDate: string
  pickupLocation: string
  insurance: boolean
  additionalFeatures: string[]
  firstName: string
  lastName: string
  email: string
  phone: string
}

export function BookingForm({ carName, onSubmit, isLoading = false }: BookingFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      insurance: false,
      additionalFeatures: [],
      pickupLocation: 'downtown',
    },
  })

  const additionalFeatures = watch('additionalFeatures')

  const onSubmitForm = (data: BookingFormData) => {
    // Validate dates
    if (new Date(data.pickupDate) >= new Date(data.returnDate)) {
      toast.error('Return date must be after pickup date')
      return
    }

    onSubmit(data)
  }

  const locations = [
    { id: 'downtown', name: 'Downtown Branch' },
    { id: 'airport', name: 'Airport Branch' },
    { id: 'waterfront', name: 'Waterfront Branch' },
  ]

  const addOns = [
    { id: 'gps', label: 'GPS Navigation', price: 50 },
    { id: 'child-seat', label: 'Child Seat', price: 50 },
    { id: 'roof-rack', label: 'Roof Rack', price: 50 },
    { id: 'cleaning', label: 'Premium Cleaning', price: 50 },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <Card className="p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-lg text-foreground mb-6">Rental Details</h3>

        <FieldGroup>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <FieldLabel htmlFor="pickupDate">Pickup Date</FieldLabel>
              <Input
                id="pickupDate"
                type="date"
                {...register('pickupDate', { required: 'Pickup date is required' })}
                className={errors.pickupDate ? 'border-destructive' : ''}
              />
              {errors.pickupDate && <p className="text-sm text-destructive mt-1">{errors.pickupDate.message}</p>}
            </div>

            <div>
              <FieldLabel htmlFor="returnDate">Return Date</FieldLabel>
              <Input
                id="returnDate"
                type="date"
                {...register('returnDate', { required: 'Return date is required' })}
                className={errors.returnDate ? 'border-destructive' : ''}
              />
              {errors.returnDate && <p className="text-sm text-destructive mt-1">{errors.returnDate.message}</p>}
            </div>
          </div>

          <div className="mb-6">
            <FieldLabel htmlFor="pickupLocation">Pickup Location</FieldLabel>
            <select
              id="pickupLocation"
              {...register('pickupLocation')}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground transition-all duration-300 hover:border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </FieldGroup>
      </Card>

      <Card className="p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-lg text-foreground mb-4">Insurance & Add-ons</h3>

        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="insurance"
              {...register('insurance')}
            />
            <Label htmlFor="insurance" className="cursor-pointer">
              <div>
                <p className="font-medium text-foreground">Insurance Coverage</p>
                <p className="text-xs text-muted-foreground">$25 per day - Comprehensive protection</p>
              </div>
            </Label>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="font-medium text-foreground mb-4">Additional Features</p>
          <div className="space-y-3">
            {addOns.map((addon) => (
              <div key={addon.id} className="flex items-center space-x-2">
                <Checkbox
                  id={addon.id}
                  value={addon.id}
                  {...register('additionalFeatures')}
                />
                <Label htmlFor={addon.id} className="cursor-pointer">
                  <div>
                    <p className="text-foreground">{addon.label}</p>
                    <p className="text-xs text-muted-foreground">${addon.price} per rental</p>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-lg text-foreground mb-6">Personal Information</h3>

        <FieldGroup>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel htmlFor="firstName">First Name</FieldLabel>
              <Input
                id="firstName"
                {...register('firstName', { required: 'First name is required' })}
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>}
            </div>

            <div>
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                id="lastName"
                {...register('lastName', { required: 'Last name is required' })}
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input
                id="phone"
                type="tel"
                {...register('phone', { required: 'Phone number is required' })}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
            </div>
          </div>
        </FieldGroup>
      </Card>

      <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Confirm Booking'}
      </Button>
    </form>
  )
}
