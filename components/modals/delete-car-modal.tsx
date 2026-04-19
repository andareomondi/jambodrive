'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog' 
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

interface DeleteCarModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  carId: string | null
  carName: string
  imageUrls: string[] 
}

export function DeleteCarModal({
  isOpen,
  onClose,
  onSuccess,
  carId,
  carName,
  imageUrls,
}: DeleteCarModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [progress, setProgress] = useState(0)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!carId) return
    setIsDeleting(true)
    setProgress(10)

    try {
      // 1. Delete from Database first
      const { error: dbError } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId)

      if (dbError) throw dbError
      setProgress(40)

      // 2. Prepare storage paths
      // Logic mirrors your split_part logic for 'car-images' bucket
      const paths = imageUrls
        .map((url) => url.split('/car-images/')[1])
        .filter(Boolean)

      if (paths.length > 0) {
        // Delete images one by one or in bulk to simulate progress
        const stepSize = 60 / paths.length
        
        for (let i = 0; i < paths.length; i++) {
          const { error: storageError } = await supabase.storage
            .from('car-images')
            .remove([paths[i]])
          
          if (storageError) console.error(`Failed to delete ${paths[i]}`)
          setProgress((prev) => Math.min(prev + stepSize, 95))
        }
      }

      setProgress(100)
      toast.success(`${carName} and its data removed permanently.`)
      
      // Delay slightly so user sees 100%
      setTimeout(() => {
        onSuccess()
        onClose()
        setIsDeleting(false)
        setProgress(0)
      }, 500)

    } catch (error: any) {
      toast.error(error.message || "Failed to delete car")
      setIsDeleting(false)
      setProgress(0)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={isDeleting ? () => {} : onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl">Delete Vehicle?</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to delete <span className="font-bold text-foreground">{carName}</span>? 
            This will permanently remove the record and all hosted images.
          </DialogDescription>
        </DialogHeader>

        {isDeleting && (
          <div className="py-6 space-y-3">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Deleting assets...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 w-full bg-slate-100 dark:bg-slate-800" />
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl flex-1 bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Car
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
