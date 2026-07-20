import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href: string
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      {Icon && <Icon className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />}
      <h3 className="text-2xl font-semibold text-foreground mb-2 text-center">{title}</h3>
      {description && <p className="text-muted-foreground text-center max-w-sm mb-6">{description}</p>}
      {action && (
        <Button asChild className="bg-accent hover:bg-accent/90">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  )
}
