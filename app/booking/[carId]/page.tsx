import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCarById } from "@/lib/services/cars";
import { createClient } from "@/lib/supabase/server";
import { AuthGuard } from "@/components/auth/auth-guard";
import BookingClientPage from "@/components/booking/booking-client";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";


type Props = {
  params: Promise<{ carId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { carId } = await params;
  try {
    const car = await getCarById(carId);
    return { title: `Book ${car.name} | Cosmara` };
  } catch {
    return { title: "Vehicle Not Found | Cosmara" };
  }
}

async function BookingContent({ params }: Props) {
  const { carId } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/auth/login?returnUrl=/booking/${carId}`);
  }

  let car = null;
  try {
    car = await getCarById(carId);
  } catch (error) {
    console.error("Failed to load car:", error);
  }

  return (
    <>
      <AuthGuard />
      <BookingClientPage car={car} />
    </>
  );
}

// 2. The Page component stays synchronous and light
export default function Page({ params }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Suspense 
        fallback={
          <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        {/* Pass the promise down directly */}
        <BookingContent params={params} />
      </Suspense>
    </div>
  );
}
