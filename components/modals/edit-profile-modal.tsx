'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserCircle, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: any
  onSuccess: (updated: any) => void
}

interface ProfileFormData {
  full_name: string
  phone: string
  email: string
}

export function EditProfileModal({ open, onOpenChange, profile, onSuccess }: EditProfileModalProps) {
  const supabase = createClient()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>()

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
      })
    }
  }, [profile, open])

  const onSubmit = async (data: ProfileFormData) => {
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name, phone: data.phone })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) { toast.error(error.message); return }

    toast.success('Profile updated successfully!')
    onSuccess(updated)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] animate-in fade-in duration-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-xl">Edit Profile</DialogTitle>
              <DialogDescription>Update your personal information</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
              {...register('full_name', { required: 'Name is required' })}
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              disabled
              className="opacity-60 cursor-not-allowed"
              {...register('email')}
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+254..."
              className="transition-all duration-200 focus:ring-2 focus:ring-accent/50"
              {...register('phone')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
