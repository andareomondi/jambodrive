export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        <div className="h-32 bg-secondary rounded-lg" />
        <div className="space-y-3">
          <div className="h-4 bg-secondary rounded w-3/4" />
          <div className="h-4 bg-secondary rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function CarCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-secondary rounded-lg h-48 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-secondary rounded w-3/4" />
        <div className="h-4 bg-secondary rounded w-1/2" />
        <div className="h-4 bg-secondary rounded w-2/3" />
      </div>
    </div>
  )
}

export function GridSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  )
}
