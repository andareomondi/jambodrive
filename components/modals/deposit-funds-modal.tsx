'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, DollarSign } from 'lucide-react'

interface DepositFundsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DepositFormData {
  amount: string
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer'
}

export function DepositFundsModal({ open, onOpenChange }: DepositFundsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<DepositFormData>({
    defaultValues: {
      amount: '',
      paymentMethod: 'credit_card',
    },
  })

  const amount = watch('amount')

  const onSubmit = async (data: DepositFormData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      const displayMethod = data.paymentMethod.replace(/_/g, ' ').toUpperCase()
      toast.success(`Successfully deposited $${parseFloat(data.amount).toFixed(2)} via ${displayMethod}`)
      
      reset()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to process deposit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] animate-in fade-in duration-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-xl">Deposit Funds</DialogTitle>
              <DialogDescription>Add funds to your JamboDrive account</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount (USD)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                className="pl-7 transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                {...register('amount', {
                  required: 'Amount is required',
                  min: {
                    value: 1,
                    message: 'Minimum deposit is $1',
                  },
                  max: {
                    value: 100000,
                    message: 'Maximum deposit is $100,000',
                  },
                })}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-sm font-medium">
              Payment Method
            </Label>
            <Select
              defaultValue="credit_card"
              onValueChange={(value) => {
                // Handle select change
              }}
            >
              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-accent/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Card
                  </div>
                </SelectItem>
                <SelectItem value="debit_card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Debit Card
                  </div>
                </SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 transition-all duration-300">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Deposit</span>
                <span className="text-lg font-semibold text-foreground">
                  ${parseFloat(amount).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onOpenChange(false)
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
              {isLoading ? 'Processing...' : 'Deposit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
