'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Car } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Fuel, Users, Zap } from 'lucide-react'

interface CarCardProps {
  car: Car
  days?: number
}

export function CarCard({ car }: CarCardProps) {
  const fuelIcons = {
    petrol: <Fuel className="w-4 h-4" />,
    diesel: <Fuel className="w-4 h-4" />,
    hybrid: <Zap className="w-4 h-4" />,
    electric: <Zap className="w-4 h-4" />,
  }

  return (
    <Link href={`/cars/${car.id}`}>
      <Card className="p-2 overflow-hidden h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative rounded-md h-65 bg-secondary overflow-hidden">
          <Image
            src={car.image}
            alt={car.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {!car.available && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-semibold">Not Available</span>
            </div>
          )}
        </div>

        <div className="p-2">
          <div className="mb-2">
            <h3 className="font-semibold text-lg text-foreground">{car.name}</h3>
            <p className="text-sm text-muted-foreground">{car.model} <Badge variant="secondary" className="text-xs capitalize">
              {car.type}
            </Badge>
</p>
          </div>
          <div className="flex gap-3 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{car.seats} seats</span>
            </div>
            <div className="flex items-center gap-1">
              {fuelIcons[car.fuel]}
              <span className="capitalize">{car.fuel}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-accent">${car.price}</p>
              <p className="text-xs text-muted-foreground">/per day</p>
            </div>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90"
              disabled={!car.available}
            >
              View
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  )
}
