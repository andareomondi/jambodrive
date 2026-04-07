'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface CarFiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  priceMin: number
  priceMax: number
  carType: string[]
  transmission: string[]
  fuel: string[]
  search: string
}

export function CarFilters({ onFilterChange }: CarFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 300,
    carType: [],
    transmission: [],
    fuel: [],
    search: '',
  })

  const carTypes = ['sedan', 'suv', 'coupe', 'hatchback', 'truck']
  const transmissions = ['manual', 'automatic']
  const fuels = ['petrol', 'diesel', 'hybrid', 'electric']

  const handleToggleArray = (key: keyof FilterState, value: string) => {
    const newFilters = {
      ...filters,
      [key]: (filters[key] as string[]).includes(value)
        ? (filters[key] as string[]).filter((item) => item !== value)
        : [...(filters[key] as string[]), value],
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newFilters = {
      ...filters,
      [type === 'min' ? 'priceMin' : 'priceMax']: value,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters = {
      priceMin: 0,
      priceMax: 300,
      carType: [],
      transmission: [],
      fuel: [],
      search: '',
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <Card className="p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-lg text-foreground">Filters</h2>
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-auto p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Label htmlFor="search" className="text-sm font-medium text-foreground mb-2 block">
          Search
        </Label>
        <Input
          id="search"
          placeholder="Car name..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="transition-all duration-300"
        />
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-foreground mb-3 block">Price per Day</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground min-w-fit">$0</span>
            <input
              type="range"
              min="0"
              max="300"
              value={filters.priceMin}
              onChange={(e) => handlePriceChange('min', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground min-w-fit">$300</span>
          </div>
          <div className="text-sm text-accent font-medium">
            ${filters.priceMin} - ${filters.priceMax}
          </div>
        </div>
      </div>

      {/* Car Type */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-foreground mb-3 block">Car Type</Label>
        <div className="space-y-2">
          {carTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.carType.includes(type)}
                onCheckedChange={() => handleToggleArray('carType', type)}
              />
              <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer capitalize">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-foreground mb-3 block">Transmission</Label>
        <div className="space-y-2">
          {transmissions.map((trans) => (
            <div key={trans} className="flex items-center space-x-2">
              <Checkbox
                id={`trans-${trans}`}
                checked={filters.transmission.includes(trans)}
                onCheckedChange={() => handleToggleArray('transmission', trans)}
              />
              <Label htmlFor={`trans-${trans}`} className="text-sm cursor-pointer capitalize">
                {trans}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Fuel Type */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-foreground mb-3 block">Fuel Type</Label>
        <div className="space-y-2">
          {fuels.map((fuel) => (
            <div key={fuel} className="flex items-center space-x-2">
              <Checkbox
                id={`fuel-${fuel}`}
                checked={filters.fuel.includes(fuel)}
                onCheckedChange={() => handleToggleArray('fuel', fuel)}
              />
              <Label htmlFor={`fuel-${fuel}`} className="text-sm cursor-pointer capitalize">
                {fuel}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
