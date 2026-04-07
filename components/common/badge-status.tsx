import { Badge } from '@/components/ui/badge'

interface BadgeStatusProps {
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  className?: string
}

export function BadgeStatus({ status, className }: BadgeStatusProps) {
  const variants: Record<string, { variant: any; label: string }> = {
    confirmed: { variant: 'default', label: 'Confirmed' },
    pending: { variant: 'secondary', label: 'Pending' },
    completed: { variant: 'outline', label: 'Completed' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
  }

  const { variant, label } = variants[status] || variants.pending

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}
