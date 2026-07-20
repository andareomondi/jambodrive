"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, CreditCard, ChevronDown, X } from "lucide-react";

interface DepositFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DepositFormData {
  amount: string;
  paymentMethod: "credit_card" | "debit_card" | "bank_transfer";
}

export function DepositFundsModal({
  open,
  onOpenChange,
}: DepositFundsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch,
  } = useForm<DepositFormData>({
    defaultValues: { amount: "", paymentMethod: "credit_card" },
  });

  const amount = watch("amount");

  const onSubmit = async (data: DepositFormData) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const displayMethod = data.paymentMethod.replace(/_/g, " ").toUpperCase();
      toast.success(
        `Successfully deposited Ksh ${parseFloat(data.amount).toFixed(2)} via ${displayMethod}`,
      );
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to process deposit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[425px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Banknote className="h-5 w-5 text-accent" />
            </div>
            <div>
              <Dialog.Title className="text-xl font-semibold text-foreground">
                Deposit Funds
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Add funds to your account to make bookings and enjoy our services seamlessly.
              </Dialog.Description>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (Ksh)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  Ksh
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="0"
                  className="pl-12"
                  {...register("amount", {
                    required: "Amount is required",
                    min: { value: 1, message: "Minimum deposit is Ksh 1" },
                    max: {
                      value: 1000000,
                      message: "Maximum deposit is Ksh 1,000,000",
                    },
                  })}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select.Root
                defaultValue="credit_card"
                onValueChange={(value) =>
                  setValue(
                    "paymentMethod",
                    value as DepositFormData["paymentMethod"],
                  )
                }
              >
                <Select.Trigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-card shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                    <Select.Viewport className="p-1">
                      {[
                        { value: "credit_card", label: "Credit Card" },
                        { value: "debit_card", label: "Debit Card" },
                        { value: "bank_transfer", label: "Bank Transfer" },
                      ].map(({ value, label }) => (
                        <Select.Item
                          key={value}
                          value={value}
                          className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground outline-none hover:bg-accent/10 focus:bg-accent/10 data-[state=checked]:text-accent"
                        >
                          {value !== "bank_transfer" && (
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Select.ItemText>{label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Total preview */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Deposit
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    Ksh {parseFloat(amount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !amount}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isLoading ? "Processing..." : "Deposit"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
