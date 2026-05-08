"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CarCard } from "@/components/cars/car-card";
import { CarFilters, FilterState } from "@/components/cars/car-filters";
import { EmptyState } from "@/components/common/empty-state";
import { Car as CarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Car } from "@/lib/mock-data";
import { useSearchParams } from "next/navigation";

const PAGE_SIZE = 9; // one full grid row × 3 cols

async function fetchCars(
  supabase: ReturnType<typeof createClient>,
  filters: FilterState,
  from: number,
  to: number,
): Promise<{ cars: Car[]; count: number }> {
  let query = supabase
    .from("cars")
    .select("*", { count: "exact" })
    .gte("price", filters.priceMin)
    .lte("price", filters.priceMax)
    .range(from, to);

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,model.ilike.%${filters.search}%`,
    );
  }

  if (filters.carType.length === 1) {
    query = query.ilike("type", filters.carType[0]);
  } else if (filters.carType.length > 1) {
    query = query.in("type", filters.carType);
  }

  if (filters.transmission.length === 1) {
    query = query.eq("transmission", filters.transmission[0]);
  } else if (filters.transmission.length > 1) {
    query = query.in("transmission", filters.transmission);
  }

  if (filters.fuel.length === 1) {
    query = query.eq("fuel", filters.fuel[0]);
  } else if (filters.fuel.length > 1) {
    query = query.in("fuel", filters.fuel);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { cars: (data as Car[]) ?? [], count: count ?? 0 };
}

function CarsContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 100000,
    carType: searchParams.get("type")
      ? [searchParams.get("type") as string]
      : [],
    transmission: [],
    fuel: [],
    search: "",
  });

  const [cars, setCars] = useState<Car[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Track how many records we've fetched so far
  const fetchedCount = cars.length;
  const hasMore = fetchedCount < totalCount;

  // Stable ref to avoid stale closures in callbacks
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const days = useMemo(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) return 1;
    const diffTime = Math.abs(
      new Date(to).getTime() - new Date(from).getTime(),
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }, [searchParams]);

  // ── Initial / filter-change fetch ─────────────────────────────────────────
  // Whenever filters change, reset to page 1
  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setCars([]);

    fetchCars(supabase, filters, 0, PAGE_SIZE - 1)
      .then(({ cars: newCars, count }) => {
        if (cancelled) return;
        setCars(newCars);
        setTotalCount(count);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const from = fetchedCount;
      const to = fetchedCount + PAGE_SIZE - 1;
      const { cars: newCars, count } = await fetchCars(
        supabase,
        filtersRef.current,
        from,
        to,
      );
      setCars((prev) => [...prev, ...newCars]);
      setTotalCount(count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchedCount, hasMore, loadingMore]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Browse Our Fleet
        </h1>
        <p className="text-muted-foreground">
          Choose from {totalCount} premium vehicles for your next journey
        </p>
      </div>

      <div className="flex flex-col">
        <div className="w-full">
          <CarFilters onFilterChange={setFilters} />
        </div>

        <div className="w-full">
          {cars.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {fetchedCount}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalCount}
                </span>{" "}
                vehicles
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <CarCard key={car.id} car={car} days={days} />
                ))}
              </div>

              {/* ── Load More ──────────────────────────────────────────── */}
              {hasMore && (
                <div className="mt-10 flex flex-col items-center gap-3">
                  <Button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="min-w-[180px] bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-8"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      `Load More (${totalCount - fetchedCount} remaining)`
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {fetchedCount} of {totalCount} vehicles loaded
                  </p>
                </div>
              )}

              {/* ── End of results ─────────────────────────────────────── */}
              {!hasMore && totalCount > PAGE_SIZE && (
                <p className="mt-10 text-center text-sm text-muted-foreground">
                  You've seen all {totalCount} vehicles.
                </p>
              )}
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
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CarsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center flex-1 h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
          </div>
        }
      >
        <CarsContent />
      </Suspense>
      <Footer />
    </div>
  );
}
