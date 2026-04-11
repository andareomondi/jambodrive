'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Car, Save, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { uploadCarImage } from '@/lib/upload-image'

type CarType = 'sedan' | 'suv' | 'hatchback' | 'truck' | 'van' | 'coupe' | 'convertible' | 'wagon'
type TransmissionType = 'automatic' | 'manual'
type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

interface CarFormData {
  name: string
  model: string
  year: number
  price: number
  image: string
  images: string          // comma-separated for simplicity
  type: CarType
  seats: number
  transmission: TransmissionType
  fuel: FuelType
  fuel_consumption: string
  features: string        // comma-separated
  description: string
  available: boolean
}

interface Car {
  id: string
  name: string
  model: string
  year: number
  price: number
  rating: number
  reviews: number
  image: string
  images: string[]
  type: CarType
  seats: number
  transmission: TransmissionType
  fuel: FuelType
  fuel_consumption: string
  features: string[]
  description: string
  available: boolean
}

interface CarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  car?: Car | null          // null/undefined = create mode
  onSuccess?: () => void    // optional callback to refresh list
}

// ── Dropdown options ──────────────────────────────────────────────────────────
const carTypeLabels: Record<CarType, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  hatchback: 'Hatchback',
  truck: 'Truck',
  van: 'Van',
  coupe: 'Coupé',
  convertible: 'Convertible',
  wagon: 'Wagon',
}

const transmissionLabels: Record<TransmissionType, string> = {
  automatic: 'Automatic',
  manual: 'Manual',
}

const fuelLabels: Record<FuelType, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
}

const currentYear = new Date().getFullYear()

// ── Component ─────────────────────────────────────────────────────────────────
export function CarModal({ open, onOpenChange, car, onSuccess }: CarModalProps) {
  const supabase = createClient()
const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
const [galleryFiles, setGalleryFiles] = useState<File[]>([])
const [uploading, setUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!car

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CarFormData>({
    defaultValues: {
      name: '',
      model: '',
      year: currentYear,
      price: 0,
      image: '',
      images: '',
      type: 'sedan',
      seats: 5,
      transmission: 'automatic',
      fuel: 'petrol',
      fuel_consumption: '',
      features: '',
      description: '',
      available: true,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (car) {
      reset({
        name: car.name,
        model: car.model,
        year: car.year,
        price: car.price,
        image: car.image ?? '',
        images: car.images?.join(', ') ?? '',
        type: car.type,
        seats: car.seats,
        transmission: car.transmission,
        fuel: car.fuel,
        fuel_consumption: car.fuel_consumption ?? '',
        features: car.features?.join(', ') ?? '',
        description: car.description ?? '',
        available: car.available,
      })
    } else {
      reset({
        name: '',
        model: '',
        year: currentYear,
        price: 0,
        image: '',
        images: '',
        type: 'sedan',
        seats: 5,
        transmission: 'automatic',
        fuel: 'petrol',
        fuel_consumption: '',
        features: '',
        description: '',
        available: true,
      })
    }
  }, [car, reset, open])

const onSubmit = async (data: CarFormData) => {
  setIsLoading(true)
  setUploading(true)
  try {
    // Upload cover image if a new file was selected
    let coverUrl = car?.image ?? ''
    if (coverImageFile) {
      coverUrl = await uploadCarImage(coverImageFile)
    }

    // Upload gallery images if new files were selected
    let galleryUrls: string[] = car?.images ?? []
    if (galleryFiles.length > 0) {
      galleryUrls = await Promise.all(galleryFiles.map(uploadCarImage))
    }

    const payload = {
      name: data.name,
      model: data.model,
      year: Number(data.year),
      price: Number(data.price),
      image: coverUrl || null,
      images: galleryUrls,
      type: data.type,
      seats: Number(data.seats),
      transmission: data.transmission,
      fuel: data.fuel,
      fuel_consumption: data.fuel_consumption || null,
      features: data.features
        ? data.features.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      description: data.description || null,
      available: data.available,
    }

    let error
    if (isEditing) {
      ;({ error } = await supabase.from('cars').update(payload).eq('id', car!.id))
    } else {
      ;({ error } = await supabase.from('cars').insert(payload))
    }

    if (error) { toast.error(error.message); return }

    toast.success(isEditing ? 'Car updated!' : 'Car added!')
    setCoverImageFile(null)
    setGalleryFiles([])
    reset()
    onOpenChange(false)
    onSuccess?.()
  } catch (err: any) {
    toast.error(err.message || 'Upload failed. Try again.')
  } finally {
    setIsLoading(false)
    setUploading(false)
  }
}
  const handleCancel = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? 'Edit Car' : 'Add New Car'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Update the details for this vehicle'
                  : 'Fill in the details to list a new vehicle'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">

          {/* ── Row: Name + Model ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Toyota"
                className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium">Model</Label>
              <Input
                id="model"
                placeholder="e.g. Corolla"
                className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                {...register('model', {
                  required: 'Model is required',
                  minLength: { value: 1, message: 'Required' },
                })}
              />
              {errors.model && (
                <p className="text-xs text-destructive">{errors.model.message}</p>
              )}
            </div>
          </div>

          {/* ── Row: Year + Price + Seats ── */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm font-medium">Year</Label>
              <Input
                id="year"
                type="number"
                min={1900}
                max={currentYear + 1}
                className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                {...register('year', {
                  required: 'Year is required',
                  min: { value: 1900, message: 'Invalid year' },
                  max: { value: currentYear + 1, message: 'Invalid year' },
                })}
              />
              {errors.year && (
                <p className="text-xs text-destructive">{errors.year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">Price / day (KES)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                {...register('price', {
                  required: 'Price is required',
                  min: { value: 0, message: 'Must be ≥ 0' },
                })}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats" className="text-sm font-medium">Seats</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                max={50}
                className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                {...register('seats', {
                  required: 'Seats required',
                  min: { value: 1, message: 'Min 1' },
                })}
              />
              {errors.seats && (
                <p className="text-xs text-destructive">{errors.seats.message}</p>
              )}
            </div>
          </div>

          {/* ── Row: Type + Transmission + Fuel ── */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type</Label>
              <Controller
                name="type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-accent/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(carTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Transmission</Label>
              <Controller
                name="transmission"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-accent/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(transmissionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Fuel</Label>
              <Controller
                name="fuel"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-accent/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(fuelLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* ── Fuel Consumption ── */}
          <div className="space-y-2">
            <Label htmlFor="fuel_consumption" className="text-sm font-medium">
              Fuel Consumption <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="fuel_consumption"
              placeholder="e.g. 12L/100km"
              className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
              {...register('fuel_consumption')}
            />
          </div>

<div className="space-y-2">
  <Label className="text-sm font-medium">
    Cover Image <span className="text-muted-foreground font-normal">(optional)</span>
  </Label>
  <Input
    type="file"
    accept="image/*"
    className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
    onChange={(e) => setCoverImageFile(e.target.files?.[0] ?? null)}
  />
</div>
          {/* ── Gallery Images ── */}
<div className="space-y-2">
  <Label className="text-sm font-medium">
    Gallery Images <span className="text-muted-foreground font-normal">(optional, select multiple)</span>
  </Label>
  <Input
    type="file"
    accept="image/*"
    multiple
    className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
    onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))}
  />
  {galleryFiles.length > 0 && (
    <p className="text-xs text-muted-foreground">{galleryFiles.length} file(s) selected</p>
  )}
</div>

          {/* ── Features ── */}
          <div className="space-y-2">
            <Label htmlFor="features" className="text-sm font-medium">
              Features{' '}
              <span className="text-muted-foreground font-normal">(comma-separated, optional)</span>
            </Label>
            <Input
              id="features"
              placeholder="e.g. GPS, Bluetooth, Sunroof"
              className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
              {...register('features')}
            />
          </div>

          {/* ── Description ── */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of the vehicle..."
              rows={3}
              className="resize-none transition-all duration-200 focus:ring-2 focus:ring-accent/50"
              {...register('description')}
            />
          </div>

          {/* ── Available toggle ── */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Available for booking</p>
              <p className="text-xs text-muted-foreground">Toggle off to hide from customers</p>
            </div>
            <Controller
              name="available"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {/* ── Info banner ── */}
          <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-accent">i</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Rating and review count are managed automatically and cannot be set manually.
            </p>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isLoading ? (uploading ? 'Uploading...' : 'Saving...') : isEditing ? 'Save Changes' : 'Add Car'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
