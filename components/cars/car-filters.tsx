'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronDown, X } from 'lucide-react'

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
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const toggleFiltersPanel = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setExpandedSection(null)
    }
  }

  const activeFilterCount = [
    ...filters.carType,
    ...filters.transmission,
    ...filters.fuel,
  ].length + (filters.search ? 1 : 0)

  return (
    <>
      {/* Collapsed Filter Button */}
      <Button
        variant="outline"
        onClick={toggleFiltersPanel}
        className="mb-4 w-full sm:w-auto flex items-center gap-2"
      >
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-accent text-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </Button>

      {/* Expandable Filter Card */}
      {isOpen && (
        <Card className="p-6 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg text-foreground">Filters</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFiltersPanel}
              className="h-auto p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Bar */}
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

          {/* Horizontal Sections with Dropdowns */}
          <div className="space-y-3 mb-6">
            {/* Price Range Section */}
            <div className="border border-border rounded-lg">
              <button
                onClick={() => toggleSection('price')}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-foreground">Price per Day</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    expandedSection === 'price' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSection === 'price' && (
                <div className="border-t border-border px-4 py-4 bg-secondary/20">
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
              )}
            </div>

            {/* Car Type Section */}
            <div className="border border-border rounded-lg">
              <button
                onClick={() => toggleSection('carType')}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-foreground">Car Type</span>
                <div className="flex items-center gap-2">
                  {filters.carType.length > 0 && (
                    <span className="text-xs bg-accent text-foreground rounded-full px-2 py-1">
                      {filters.carType.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      expandedSection === 'carType' ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              {expandedSection === 'carType' && (
                <div className="border-t border-border px-4 py-4 bg-secondary/20 space-y-3">
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
              )}
            </div>

            {/* Transmission Section */}
            <div className="border border-border rounded-lg">
              <button
                onClick={() => toggleSection('transmission')}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-foreground">Transmission</span>
                <div className="flex items-center gap-2">
                  {filters.transmission.length > 0 && (
                    <span className="text-xs bg-accent text-foreground rounded-full px-2 py-1">
                      {filters.transmission.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      expandedSection === 'transmission' ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              {expandedSection === 'transmission' && (
                <div className="border-t border-border px-4 py-4 bg-secondary/20 space-y-3">
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
              )}
            </div>

            {/* Fuel Type Section */}
            <div className="border border-border rounded-lg">
              <button
                onClick={() => toggleSection('fuel')}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-foreground">Fuel Type</span>
                <div className="flex items-center gap-2">
                  {filters.fuel.length > 0 && (
                    <span className="text-xs bg-accent text-foreground rounded-full px-2 py-1">
                      {filters.fuel.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      expandedSection === 'fuel' ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              {expandedSection === 'fuel' && (
                <div className="border-t border-border px-4 py-4 bg-secondary/20 space-y-3">
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
              )}
            </div>
          </div>

          {/* Reset Button */}
          <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
            Reset Filters
          </Button>
        </Card>
      )}
    </>
  )
}
