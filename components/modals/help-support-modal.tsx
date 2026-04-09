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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HelpCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface HelpSupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface HelpFormData {
  subject: string
  category: 'technical' | 'booking' | 'car_issue' | 'payment' | 'other'
  message: string
}

const categoryLabels: Record<string, string> = {
  technical: 'Technical Issue',
  booking: 'Booking Issue',
  car_issue: 'Car Issue',
  payment: 'Payment Issue',
  other: 'Other',
}

export function HelpSupportModal({ open, onOpenChange }: HelpSupportModalProps) {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<HelpFormData>({
    defaultValues: {
      subject: '',
      category: 'technical',
      message: '',
    },
  })

  const messageLength = watch('message').length
  const maxMessageLength = 1000

  const onSubmit = async (data: HelpFormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from('support_requests').insert({
        subject: data.subject,
        category: data.category,
        message: data.message,
      })

      if (error) {
        toast.error(error.message || 'An error occurred while submitting your request.')
        return
      }
      
      toast.success('Support request submitted successfully! Our team will respond within 24 hours.')
      
      reset()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to submit support request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] animate-in fade-in duration-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-xl">Help & Support</DialogTitle>
              <DialogDescription>Get assistance from our support team</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
              {...register('subject', {
                required: 'Subject is required',
                minLength: {
                  value: 5,
                  message: 'Subject must be at least 5 characters',
                },
              })}
            />
            {errors.subject && (
              <p className="text-xs text-destructive mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Select defaultValue="technical">
              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-accent/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="message" className="text-sm font-medium">
                Message
              </Label>
              <span className={`text-xs transition-colors ${
                messageLength > maxMessageLength * 0.9
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}>
                {messageLength}/{maxMessageLength}
              </span>
            </div>
            <Textarea
              id="message"
              placeholder="Describe your issue in detail..."
              rows={4}
              maxLength={maxMessageLength}
              className="resize-none transition-all duration-200 focus:ring-2 focus:ring-accent/50"
              {...register('message', {
                required: 'Message is required',
                minLength: {
                  value: 10,
                  message: 'Message must be at least 10 characters',
                },
                maxLength: {
                  value: maxMessageLength,
                  message: `Message must not exceed ${maxMessageLength} characters`,
                },
              })}
            />
            {errors.message && (
              <p className="text-xs text-destructive mt-1">{errors.message.message}</p>
            )}
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-accent">i</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Our support team typically responds within 24 hours. You&apos;ll receive updates via email.
            </p>
          </div>

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
              disabled={isLoading}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
