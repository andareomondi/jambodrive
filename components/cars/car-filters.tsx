'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider' // Ensure you have this shadcn component
import { Filter, X, RotateCcw, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    priceMax: 1000000,
    carType: [],
    transmission: [],
    fuel: [],
    search: '',
  })
  const [isOpen, setIsOpen] = useState(false)

  const carTypes = ['toyota', 'suv', 'coupe', 'hatchback', 'truck']
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

  const handlePriceChange = (values: number[]) => {
    const newFilters = { ...filters, priceMin: values[0], priceMax: values[1] }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const reset = { priceMin: 0, priceMax: 1000000, carType: [], transmission: [], fuel: [], search: '' }
    setFilters(reset)
    onFilterChange(reset)
  }

  // Reusable Pill Component
  const FilterPill = ({ label, isSelected, onClick }: { label: string, isSelected: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
        isSelected 
          ? "bg-accent text-accent-foreground border-accent shadow-sm" 
          : "bg-background text-muted-foreground border-slate-200 hover:border-accent/50 hover:bg-slate-50"
      )}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </button>
  )

  const activeFilterCount = [...filters.carType, ...filters.transmission, ...filters.fuel].length

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cars..."
            value={filters.search}
            onChange={(e) => {
              const nf = { ...filters, search: e.target.value }
              setFilters(nf)
              onFilterChange(nf)
            }}
            className="pl-10 h-11 rounded-xl bg-white border-slate-200"
          />
        </div>
        <Button 
          variant={isOpen ? "default" : "outline"} 
          onClick={() => setIsOpen(!isOpen)}
          className="h-11 px-4 rounded-xl gap-2 flex shrink-0"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Expanded Filter Panel */}
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100 mb-8" : "grid-rows-[0fr] opacity-0 overflow-hidden"
      )}>
        <Card className="min-h-0 p-6 rounded-2xl border-none shadow-md bg-white dark:bg-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Filter Options</h3>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-white">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All
            </Button>
          </div>

          <div className="space-y-8">
            {/* Price Slider */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label className="text-sm font-semibold">Price Range (per day)</Label>
                <span className="text-sm font-bold text-accent">Ksh {filters.priceMin} - Ksh {filters.priceMax}</span>
              </div>
              <Slider
                defaultValue={[0, 1000000]}
                max={1000000}
                step={10}
                value={[filters.priceMin, filters.priceMax]}
                onValueChange={handlePriceChange}
                className="py-4"
              />
            </div>

            {/* Filter Groups */}
            {[
              { label: 'Vehicle Type', key: 'carType', options: carTypes },
              { label: 'Transmission', key: 'transmission', options: transmissions },
              { label: 'Fuel Type', key: 'fuel', options: fuels },
            ].map((group) => (
              <div key={group.label} className="space-y-3">
                <Label className="text-sm font-semibold">{group.label}</Label>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => (
                    <FilterPill
                      key={option}
                      label={option}
                      isSelected={(filters[group.key as keyof FilterState] as string[]).includes(option)}
                      onClick={() => handleToggleArray(group.key as keyof FilterState, option)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
