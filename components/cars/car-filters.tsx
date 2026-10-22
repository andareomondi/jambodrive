"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, RotateCcw, Search, Check, X } from "lucide-react";
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
  chauffeured: boolean | null;
}

export function CarFilters({ onFilterChange }: CarFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 100000,
    carType: [],
    transmission: [],
    fuel: [],
    search: "",
    chauffeured: null,
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
      chauffeured: null,
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
        "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
        isSelected
          ? "bg-accent text-accent-foreground border-accent shadow-none"
          : "bg-background text-muted-foreground border-border/80 hover:border-border hover:bg-secondary/50",
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
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or model..."
            value={filters.search}
            onChange={(e) => {
              const newFilters = { ...filters, search: e.target.value };
              setFilters(newFilters);
              onFilterChange(newFilters);
            }}
            className="pl-10 h-10 rounded-xl bg-background border-border/80 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>
        <Button
          variant={isOpen ? "default" : "outline"}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-10 px-4 rounded-xl gap-2 flex shrink-0 text-xs font-semibold shadow-none",
            isOpen
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "border-border/80 text-foreground",
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-foreground text-background text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
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
            ? "grid-rows-[1fr] opacity-150 mb-8"
            : "grid-rows-[0fr] opacity-0 overflow-hidden",
        )}
      >
        <Card className="min-h-0 p-5 sm:p-6 rounded-2xl border border-border/60 shadow-sm bg-card/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Filter Fleet
              </h3>
              <p className="text-xs text-muted-foreground">
                Narrow down vehicle specifications
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset All
            </Button>
          </div>

          <div className="space-y-6">
            {/* Radix Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <Label className="font-semibold text-foreground">
                  Max Price per Day
                </Label>
                <span className="font-semibold text-accent">
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
                className="relative flex w-full touch-none select-none items-center py-3"
              >
                <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
                  <Slider.Range className="absolute h-full bg-accent" />
                </Slider.Track>
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-background shadow-xs transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-background shadow-xs transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
              </Slider.Root>
            </div>

            {/* Filter Groups */}
            {[
              { label: "Vehicle Category", key: "carType", options: carTypes },
              {
                label: "Transmission",
                key: "transmission",
                options: transmissions,
              },
              { label: "Fuel Type", key: "fuel", options: fuels },
            ].map((group) => (
              <div key={group.label} className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </Label>
                <div className="flex flex-wrap gap-1.5">
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

            {/* Chauffeured Option */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Driver Service
              </Label>
              <div className="flex gap-1.5">
                <FilterPill
                  label="Chauffeured"
                  isSelected={filters.chauffeured === true}
                  onClick={() => {
                    const newFilters = {
                      ...filters,
                      chauffeured: filters.chauffeured === true ? null : true,
                    };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                />
                <FilterPill
                  label="Self-Drive"
                  isSelected={filters.chauffeured === false}
                  onClick={() => {
                    const newFilters = {
                      ...filters,
                      chauffeured: filters.chauffeured === false ? null : false,
                    };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-border/50 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 rounded-lg border-border/80"
              onClick={handleReset}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="text-xs h-9 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-4"
              onClick={() => setIsOpen(false)}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Apply Filters
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
