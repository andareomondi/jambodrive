'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CarCard } from '@/components/cars/car-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/empty-state'
import { Star, Fuel, Users, Zap, CheckCircle, MapPin, Calendar, Shield } from 'lucide-react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { DatabaseService } from '@/lib/services'
import type { Car, Review } from '@/lib/mock-data'

export default function CarDetailsPage() {
  const params = useParams()
  const carId = params.id as string
  const [selectedImage, setSelectedImage] = useState(0)
const [car, setCar] = useState<Car | null>(null)
const [relatedCars, setRelatedCars] = useState<Car[]>([])
const [loading, setLoading] = useState(true)


  useEffect(() => {
    const db = new DatabaseService(createClient())

    const fetchData = async () => {
      try {
        // 1. Get the current car FIRST
        const carData = await db.getCarById(carId)
        if (!carData) {
          setCar(null)
          return
        }

        setCar(carData)

        // 2. Get all cars and filter properly
        const allCars = await db.getCars()

        const filtered = allCars
          .filter((c) => c.type === carData.type && c.id !== carData.id)
          .slice(0, 3)

        setRelatedCars(filtered)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [carId])

if (loading) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
      <Footer />
    </div>
  )
}

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Car Not Found"
            description="The car you&apos;re looking for doesn&apos;t exist."
            action={{ label: 'Back to Cars', href: '/cars' }}
          />
        </div>
        <Footer />
      </div>
    )
  }

  const fuelIcon = <Fuel className="w-5 h-5" />

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link href="/cars" className="inline-flex items-center text-accent hover:text-accent/80 mb-8 transition-colors">
          ← Back to Cars
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="relative h-96 bg-secondary rounded-lg overflow-hidden mb-4">
              <Image
                src={car.images[selectedImage]}
                alt={car.name}
                fill
                className="object-cover"
                priority
              />
              {!car.available && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">Not Available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {car.images.length > 1 && (
              <div className="flex gap-3">
                {car.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-20 w-20 rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-accent' : 'border-border'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${car.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Car Info Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">About This Vehicle</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">{car.description}</p>

              {/* Features Grid */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {car.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 shadow-medium sticky top-32">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">{car.name}</h2>
                <p className="text-muted-foreground text-sm">{car.model}</p>
              </div>
              {/* Specs */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Seats</span>
                  <span className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" /> {car.seats}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transmission</span>
                  <span className="text-sm font-medium text-foreground capitalize">{car.transmission}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fuel Type</span>
                  <span className="text-sm font-medium text-foreground flex items-center gap-1 capitalize">
                    <Zap className="w-4 h-4" /> {car.fuel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Consumption</span>
                  <span className="text-sm font-medium text-foreground">{car.fuel_consumption}</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="text-sm text-muted-foreground mb-1">Price per day</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-accent">${car.price}</span>
                  <span className="text-muted-foreground">/day</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-6">
                {[
                  { icon: Shield, label: 'Insurance Included' },
                  { icon: Calendar, label: 'Flexible Dates' },
                  { icon: MapPin, label: 'Multiple Locations' },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="w-4 h-4 text-accent" />
                      <span>{item.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* CTA Button */}
              <Button
                asChild
                className="w-full bg-accent hover:bg-accent/90 text-base"
                disabled={!car.available}
              >
                <Link href={`/booking/${car.id}`}>Book Now</Link>
              </Button>

              {!car.available && (
                <p className="text-center text-sm text-muted-foreground mt-4">This vehicle is currently unavailable</p>
              )}
            </Card>
          </div>
        </div>

        {/* Related Cars */}
        {relatedCars.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Similar Vehicles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCars.map((relatedCar) => (
                <CarCard key={relatedCar.id} car={relatedCar} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
