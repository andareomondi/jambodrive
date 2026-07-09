"use client";

import { useState, useRef } from "react";
import * as Slider from "@radix-ui/react-slider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, RotateCcw, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  priceMin: number;
  priceMax: number;
  carType: string[];
  transmission: string[];
  fuel: string[];
  search: string;
}

export function CarFilters({ onFilterChange }: CarFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 100000,
    carType: [],
    transmission: [],
    fuel: [],
    search: "",
  });
  const [isOpen, setIsOpen] = useState(false);

  const carTypes = [
    "economy",
    "compact",
    "executive",
    "suv",
    "ssuv",
    "vans",
    "trucks",
  ];
  const transmissions = ["manual", "automatic"];
  const fuels = ["petrol", "diesel", "hybrid", "electric"];

  const formatLabel = (val: string) => {
    if (val === "ssuv") return "Luxury SUV";
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const handleToggleArray = (key: keyof FilterState, value: string) => {
    const newFilters = {
      ...filters,
      [key]: (filters[key] as string[]).includes(value)
        ? (filters[key] as string[]).filter((item) => item !== value)
        : [...(filters[key] as string[]), value],
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const reset = {
      priceMin: 0,
      priceMax: 100000,
      carType: [],
      transmission: [],
      fuel: [],
      search: "",
    };
    setFilters(reset);
    onFilterChange(reset);
    setIsOpen(false);
  };

  const FilterPill = ({
    label,
    isSelected,
    onClick,
  }: {
    label: string;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
        isSelected
          ? "bg-accent text-accent-foreground border-accent shadow-sm"
          : "bg-background text-muted-foreground border-border hover:border-accent/50 hover:bg-muted",
      )}
    >
      {formatLabel(label)}
    </button>
  );

  const activeFilterCount = [
    ...filters.carType,
    ...filters.transmission,
    ...filters.fuel,
  ].length;

  return (
    <div className="w-full">
      {/* Top Search & Toggle Bar */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cars..."
            value={filters.search}
            onChange={(e) => {
              const newFilters = { ...filters, search: e.target.value };
              setFilters(newFilters);
              onFilterChange(newFilters);
            }}
            className="pl-10 h-11 rounded-xl bg-background border-border"
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
            <span className="ml-1 bg-foreground text-background text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Expanded Filter Panel */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen
            ? "grid-rows-[1fr] opacity-100 mb-8"
            : "grid-rows-[0fr] opacity-0 overflow-hidden",
        )}
      >
        <Card className="min-h-0 p-4 sm:p-6 rounded-2xl border-none shadow-md bg-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Filter Options</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="hidden sm:flex text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All
            </Button>
          </div>

          <div className="space-y-8">
            {/* Direct Radix Slider Implementation */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">
                  Price Range (per day)
                </Label>
                <span className="text-sm font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
                  Ksh {filters.priceMin.toLocaleString()} - Ksh{" "}
                  {filters.priceMax.toLocaleString()}
                </span>
              </div>

              <Slider.Root
                defaultValue={[0, 100000]}
                max={100000}
                step={1000}
                value={[filters.priceMin, filters.priceMax]}
                onValueChange={(vals) => {
                  setFilters((prev) => ({
                    ...prev,
                    priceMin: vals[0],
                    priceMax: vals[1],
                  }));
                }}
                onValueCommit={(vals) => {
                  const newFilters = {
                    ...filters,
                    priceMin: vals[0],
                    priceMax: vals[1],
                  };
                  onFilterChange(newFilters);
                }}
                className="relative flex w-full touch-none select-none items-center py-4"
              >
                <Slider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
                  <Slider.Range className="absolute h-full bg-accent" />
                </Slider.Track>
                <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-accent bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50" />
                <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-accent bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50" />
              </Slider.Root>
            </div>

            {/* Filter Groups */}
            {[
              { label: "Vehicle Type", key: "carType", options: carTypes },
              {
                label: "Transmission",
                key: "transmission",
                options: transmissions,
              },
              { label: "Fuel Type", key: "fuel", options: fuels },
            ].map((group) => (
              <div key={group.label} className="space-y-3">
                <Label className="text-sm font-semibold">{group.label}</Label>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => (
                    <FilterPill
                      key={option}
                      label={option}
                      isSelected={(
                        filters[group.key as keyof FilterState] as string[]
                      ).includes(option)}
                      onClick={() =>
                        handleToggleArray(
                          group.key as keyof FilterState,
                          option,
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Mobile Actions (Sticky-ish bottom UX) */}
          <div className="mt-8 pt-5 border-t border-border flex flex-col-reverse sm:flex-row gap-3 justify-end items-center">
            <Button
              variant="ghost"
              className="w-full sm:w-auto text-muted-foreground sm:hidden"
              onClick={handleReset}
            >
              Reset Filters
            </Button>
            <Button
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={() => setIsOpen(false)}
            >
              <Check className="w-4 h-4 mr-2" />
              View Results
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
