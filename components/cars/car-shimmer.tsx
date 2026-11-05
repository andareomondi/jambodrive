import { Card } from "@/components/ui/card";

function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-muted ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-background/60 to-transparent [animation:shimmer_1.6s_infinite]" />
    </div>
  );
}

export function CarShimmerCard() {
  return (
    <Card className="overflow-hidden h-full flex flex-col rounded-2xl border-border bg-card">
      <Bar className="h-56 w-full rounded-none" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <Bar className="h-5 w-3/5" />
          <Bar className="h-3 w-2/5" />
        </div>
        <div className="flex gap-3 pt-1">
          <Bar className="h-3 w-16" />
          <Bar className="h-3 w-16" />
          <Bar className="h-3 w-14" />
        </div>
      </div>
      <div className="p-5 pt-0 space-y-3">
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Bar className="h-3 w-24" />
          <Bar className="h-5 w-20" />
        </div>
        <Bar className="h-11 w-full rounded-xl" />
      </div>
    </Card>
  );
}

export function CarShimmerGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CarShimmerCard key={i} />
      ))}
    </div>
  );
}
