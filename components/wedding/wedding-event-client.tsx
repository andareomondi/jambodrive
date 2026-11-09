"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronRight,
  Heart,
  Loader2,
  Palette,
  PartyPopper,
  Phone,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppImage } from "@/components/ui/app-image";
import { createWeddingEventRequest } from "@/lib/actions/wedding-events";
import type { Car } from "@/types";

const CAR_TYPES = [
  "Premium",
  "Executive",
  "Luxury SUV",
  "Classic",
  "Convertible",
  "Vans",
  "Other",
];
const COLOR_SUGGESTIONS = [
  "White & gold",
  "Black & gold",
  "Ivory & champagne",
  "Burgundy & blush",
  "Custom colours",
];
const STEPS = ["Your day", "Fleet & style", "Contact"];

interface WeddingEventClientProps {
  cars: Car[];
}

interface WeddingForm {
  eventDate: string;
  budgetMin: string;
  budgetMax: string;
  carCount: string;
  preferredCarTypes: string[];
  colorScheme: string;
  sampleCarIds: string[];
  venue: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const INITIAL_FORM: WeddingForm = {
  eventDate: "",
  budgetMin: "",
  budgetMax: "",
  carCount: "1",
  preferredCarTypes: [],
  colorScheme: "",
  sampleCarIds: [],
  venue: "",
  notes: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatCurrency(value: string) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0
    ? `KSh ${amount.toLocaleString("en-KE")}`
    : "—";
}

export function WeddingEventClient({ cars }: WeddingEventClientProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const sampledCars = useMemo(
    () => cars.filter((car) => form.sampleCarIds.includes(car.id)),
    [cars, form.sampleCarIds],
  );
  const minDate = localDateString(new Date());

  const updateForm = <K extends keyof WeddingForm>(
    key: K,
    value: WeddingForm[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const toggleCarType = (type: string) => {
    setForm((current) => ({
      ...current,
      preferredCarTypes: current.preferredCarTypes.includes(type)
        ? current.preferredCarTypes.filter((item) => item !== type)
        : [...current.preferredCarTypes, type],
    }));
  };

  const toggleSampleCar = (carId: string) => {
    setForm((current) => {
      const selected = current.sampleCarIds.includes(carId);
      if (!selected && current.sampleCarIds.length >= 12) {
        toast.error("You can choose up to 12 sample cars.");
        return current;
      }
      return {
        ...current,
        sampleCarIds: selected
          ? current.sampleCarIds.filter((id) => id !== carId)
          : [...current.sampleCarIds, carId],
      };
    });
  };

  const validateStep = () => {
    if (step === 0) {
      const eventDate = new Date(`${form.eventDate}T00:00:00`);
      const today = new Date(`${minDate}T00:00:00`);
      if (!form.eventDate || !Number.isFinite(eventDate.getTime()) || eventDate <= today) {
        toast.error("Choose a wedding date in the future.");
        return false;
      }
      const min = Number(form.budgetMin);
      const max = Number(form.budgetMax);
      if (
        !Number.isSafeInteger(min) ||
        !Number.isSafeInteger(max) ||
        min < 1 ||
        max < min
      ) {
        toast.error("Enter a valid budget range in Kenyan shillings.");
        return false;
      }
      const count = Number(form.carCount);
      if (!Number.isInteger(count) || count < 1 || count > 30) {
        toast.error("Choose between 1 and 30 cars.");
        return false;
      }
    }

    if (step === 1) {
      if (form.preferredCarTypes.length === 0) {
        toast.error("Choose at least one type of car.");
        return false;
      }
      if (form.colorScheme.trim().length < 2) {
        toast.error("Add a colour scheme or describe the look you want.");
        return false;
      }
    }

    if (step === 2) {
      if (form.contactName.trim().length < 2) {
        toast.error("Enter your name so our team knows who to contact.");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
        toast.error("Enter a valid email address.");
        return false;
      }
      if (!/^\+?[\d\s()-]{9,20}$/.test(form.contactPhone.trim())) {
        toast.error("Enter a valid phone number.");
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (validateStep()) setStep((current) => Math.min(current + 1, 2));
  };

  const handleSubmit = async () => {
    if (!validateStep() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await createWeddingEventRequest({
        ...form,
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        carCount: Number(form.carCount),
      });
      setRequestId(result.id);
      toast.success("Your wedding transport enquiry has been sent.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not submit your wedding enquiry.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestId) {
    return (
      <Card className="mx-auto max-w-2xl rounded-3xl p-7 text-center shadow-lg sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CheckCircle className="h-9 w-9" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Enquiry received
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Let&apos;s make your arrival memorable.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
          Our wedding transport team will review your date, budget, and vehicle
          inspiration, then contact you to discuss availability and a tailored
          quote. This enquiry is not a booking or vehicle reservation.
        </p>
        <div className="mt-6 rounded-2xl bg-muted/50 p-4 text-sm">
          <p className="text-muted-foreground">Your enquiry reference</p>
          <p className="mt-1 font-mono font-semibold text-foreground">
            {requestId.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <Button asChild className="mt-6 rounded-xl">
          <Link href="/">Back to Cosmara</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/"
        className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div>
          <div className="mb-8">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              <PartyPopper className="h-4 w-4" />
              Wedding transport
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              A beautiful arrival starts with a plan.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Tell us about your day, the cars you have in mind, and your budget.
              Share inspiration from our fleet—even if a car is currently hired.
              We&apos;ll follow up with a tailored proposal.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2" aria-label="Enquiry steps">
            {STEPS.map((title, index) => {
              const active = step === index;
              const complete = step > index;
              return (
                <div
                  key={title}
                  aria-current={active ? "step" : undefined}
                  className={`rounded-xl border p-3 ${
                    active
                      ? "border-accent bg-accent/10"
                      : complete
                        ? "border-accent/30 bg-accent/5"
                        : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        active || complete
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span
                      className={`text-xs font-semibold sm:text-sm ${
                        active ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="rounded-3xl border-border p-5 shadow-sm sm:p-8">
            {step === 0 && (
              <section aria-labelledby="wedding-day-heading" className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-accent">
                    Step 1 of 3
                  </p>
                  <h2
                    id="wedding-day-heading"
                    className="mt-1 text-2xl font-semibold text-foreground"
                  >
                    Tell us about your day
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start with the date, your transport budget, and how many cars
                    you expect to need.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-date">Wedding date</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="event-date"
                      type="date"
                      min={minDate}
                      value={form.eventDate}
                      onChange={(event) =>
                        updateForm("eventDate", event.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Wedding transport budget (KSh)</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor="budget-min"
                        className="text-xs font-normal text-muted-foreground"
                      >
                        Minimum
                      </Label>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="budget-min"
                          type="number"
                          min={1}
                          step={1000}
                          inputMode="numeric"
                          placeholder="e.g. 50,000"
                          value={form.budgetMin}
                          onChange={(event) =>
                            updateForm("budgetMin", event.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="budget-max"
                        className="text-xs font-normal text-muted-foreground"
                      >
                        Maximum
                      </Label>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="budget-max"
                          type="number"
                          min={Number(form.budgetMin) || 1}
                          step={1000}
                          inputMode="numeric"
                          placeholder="e.g. 150,000"
                          value={form.budgetMax}
                          onChange={(event) =>
                            updateForm("budgetMax", event.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A range helps us suggest options that fit comfortably.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="car-count">How many cars do you need?</Label>
                  <Input
                    id="car-count"
                    type="number"
                    min={1}
                    max={30}
                    value={form.carCount}
                    onChange={(event) =>
                      updateForm("carCount", event.target.value)
                    }
                    className="sm:max-w-xs"
                  />
                </div>
              </section>
            )}

            {step === 1 && (
              <section aria-labelledby="wedding-style-heading" className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-accent">
                    Step 2 of 3
                  </p>
                  <h2
                    id="wedding-style-heading"
                    className="mt-1 text-2xl font-semibold text-foreground"
                  >
                    Choose your fleet & style
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select the kinds of vehicles you like and any fleet cars
                    that capture your vision.
                  </p>
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">
                    What types of cars are you looking for?
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {CAR_TYPES.map((type) => {
                      const selected = form.preferredCarTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleCarType(type)}
                          className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            selected
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border bg-background text-foreground hover:border-accent/50"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <Label>Pick sample cars from our fleet</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Optional · select up to 12. These are inspiration only,
                        not a reservation.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {form.sampleCarIds.length}/12 selected
                    </span>
                  </div>
                  {cars.length === 0 ? (
                    <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                      Fleet examples are temporarily unavailable. You can still
                      describe the vehicle types you want.
                    </p>
                  ) : (
                    <div className="grid max-h-[440px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                      {cars.map((car) => {
                        const selected = form.sampleCarIds.includes(car.id);
                        return (
                          <button
                            key={car.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleSampleCar(car.id)}
                            className={`flex min-h-[92px] items-center gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              selected
                                ? "border-accent bg-accent/5 ring-1 ring-accent"
                                : "border-border hover:border-accent/50"
                            }`}
                          >
                            <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                              {car.image && (
                                <AppImage
                                  src={car.image}
                                  alt={car.name}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {car.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {car.model} · {car.type ?? "Fleet"}
                              </span>
                              <span
                                className={`mt-1 block text-[11px] ${
                                  car.available
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {car.available
                                  ? "Available now"
                                  : "Currently hired"}
                              </span>
                            </span>
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border text-transparent"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    A currently hired car can still be selected as inspiration.
                    Our team will check actual availability for your date.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-accent" />
                    <Label htmlFor="color-scheme">
                      Wedding colours / car colour preference
                    </Label>
                  </div>
                  <Input
                    id="color-scheme"
                    value={form.colorScheme}
                    maxLength={120}
                    onChange={(event) =>
                      updateForm("colorScheme", event.target.value)
                    }
                    placeholder="e.g. ivory cars with burgundy ribbons"
                  />
                  <div className="flex flex-wrap gap-2">
                    {COLOR_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => updateForm("colorScheme", suggestion)}
                        className="min-h-9 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">Venue / route (optional)</Label>
                  <Input
                    id="venue"
                    maxLength={200}
                    value={form.venue}
                    onChange={(event) => updateForm("venue", event.target.value)}
                    placeholder="e.g. Nairobi CBD to Karen"
                  />
                </div>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="wedding-contact-heading" className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-accent">
                    Step 3 of 3
                  </p>
                  <h2
                    id="wedding-contact-heading"
                    className="mt-1 text-2xl font-semibold text-foreground"
                  >
                    Where can we reach you?
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We&apos;ll use these details to discuss your plans and
                    prepare a tailored quote.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="contact-name">Your name</Label>
                    <Input
                      id="contact-name"
                      autoComplete="name"
                      value={form.contactName}
                      maxLength={120}
                      onChange={(event) =>
                        updateForm("contactName", event.target.value)
                      }
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email address</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      value={form.contactEmail}
                      maxLength={254}
                      onChange={(event) =>
                        updateForm("contactEmail", event.target.value)
                      }
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone number</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.contactPhone}
                      maxLength={20}
                      onChange={(event) =>
                        updateForm("contactPhone", event.target.value)
                      }
                      placeholder="07XX XXX XXX"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="notes">Anything else we should know? (optional)</Label>
                    <textarea
                      id="notes"
                      value={form.notes}
                      maxLength={1500}
                      rows={4}
                      onChange={(event) => updateForm("notes", event.target.value)}
                      placeholder="Timings, decorations, multiple pickup points, or special requests"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <h3 className="font-semibold text-foreground">Your enquiry summary</h3>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Date</dt>
                      <dd className="font-medium text-foreground">
                        {new Date(`${form.eventDate}T12:00:00`).toLocaleDateString(
                          "en-KE",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Budget range</dt>
                      <dd className="font-medium text-foreground">
                        {formatCurrency(form.budgetMin)} – {formatCurrency(form.budgetMax)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Cars requested</dt>
                      <dd className="font-medium text-foreground">
                        {form.carCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Types & colours</dt>
                      <dd className="font-medium text-foreground">
                        {form.preferredCarTypes.join(", ")} · {form.colorScheme}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-muted-foreground">
                        Sample fleet cars
                      </dt>
                      <dd className="font-medium text-foreground">
                        {sampledCars.length
                          ? sampledCars.map((car) => car.name).join(", ")
                          : "No samples selected"}
                      </dd>
                    </div>
                  </dl>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Sending this enquiry does not reserve vehicles or confirm a
                  booking. Your details will be used by Cosmara to respond to
                  this wedding transport request.
                </p>
              </section>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0 || isSubmitting}
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
                className="rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {step < 2 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="rounded-xl"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="rounded-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? "Sending enquiry…" : "Send wedding enquiry"}
                </Button>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="rounded-3xl border-accent/20 p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              At a glance
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Wedding date</p>
                  <p className="text-sm font-medium text-foreground">
                    {form.eventDate
                      ? new Date(`${form.eventDate}T12:00:00`).toLocaleDateString(
                          "en-KE",
                          { day: "numeric", month: "short", year: "numeric" },
                        )
                      : "Not selected"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Your budget</p>
                  <p className="text-sm font-medium text-foreground">
                    {form.budgetMin && form.budgetMax
                      ? `${formatCurrency(form.budgetMin)} – ${formatCurrency(form.budgetMax)}`
                      : "Add a budget range"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Transport</p>
                  <p className="text-sm font-medium text-foreground">
                    {form.carCount || "1"} {Number(form.carCount) === 1 ? "car" : "cars"}
                    {form.sampleCarIds.length
                      ? ` · ${form.sampleCarIds.length} inspiration selected`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-muted/50 p-4">
              <p className="text-sm font-semibold text-foreground">
                A personal proposal, not a generic package.
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Our team will use your choices as a starting point and confirm
                actual availability, pricing, and details with you.
              </p>
            </div>
          </Card>

          <p className="px-2 text-xs leading-5 text-muted-foreground">
            Need help planning?{" "}
            <a
              href="tel:+254758500943"
              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              Call our team
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </p>
        </aside>
      </div>
    </div>
  );
}
