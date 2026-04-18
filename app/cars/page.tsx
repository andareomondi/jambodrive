'use client'

import { useState, useMemo } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CarCard } from '@/components/cars/car-card'
import { CarFilters, FilterState } from '@/components/cars/car-filters'
import { EmptyState } from '@/components/common/empty-state'
import { Car as CarIcon } from 'lucide-react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { DatabaseService } from '@/lib/services'
import type { Car } from '@/lib/mock-data'
import { useSearchParams } from 'next/navigation'

export default function CarsPage() {
const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 1000000,
    carType: searchParams.get('type') ? [searchParams.get('type') as string] : [],
    transmission: [],
    fuel: [],
    search: '',
  })
const [cars, setCars] = useState<Car[]>([])
const supabase = useMemo(() => createClient(), [])
const db = useMemo(() => new DatabaseService(supabase), [supabase])

const days = useMemo(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    if (!from || !to) return 1
    
    const diffTime = Math.abs(new Date(to).getTime() - new Date(from).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays || 1
  }, [searchParams])

useEffect(() => {
  db.getCars().then(setCars).catch(console.error)
}, [])

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      // Search filter
      if (filters.search && !car.name.toLowerCase().includes(filters.search.toLowerCase()) && !car.model.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Price filter
      if (car.price < filters.priceMin || car.price > filters.priceMax) {
        return false
      }

      // Car type filter
      if (filters.carType.length > 0 && !filters.carType.includes(car.type.toLowerCase())) {
        return false
      }

      // Transmission filter
      if (filters.transmission.length > 0 && !filters.transmission.includes(car.transmission)) {
        return false
      }

      // Fuel filter
      if (filters.fuel.length > 0 && !filters.fuel.includes(car.fuel)) {
        return false
      }

      return true
    })
  }, [filters, cars])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Browse Our Fleet</h1>
          <p className="text-muted-foreground">
            Choose from {cars.length} premium vehicles for your next journey
          </p>
        </div>

        <div className="flex flex-col">
          {/* Filters Sidebar */}
          <div className="w-full">
            <CarFilters onFilterChange={setFilters} />
          </div>

          {/* Cars Grid */}
          <div className="w-full">
            {filteredCars.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {filteredCars.length} of {cars.length} vehicles
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredCars.map((car) => (
                    <CarCard key={car.id} car={car} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={CarIcon}
                title="No Vehicles Found"
                description="Try adjusting your filters to find the perfect car for your journey."
              />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
