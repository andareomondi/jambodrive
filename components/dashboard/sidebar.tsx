'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Car,
  Barcode,
  TrendingUp,
  Package,
  RotateCcw,
  LogOut,
  Menu,
} from 'lucide-react'

interface DashboardSidebarProps {
  userRole: 'super_admin' | 'facilitator'
  userName?: string
}

export function DashboardSidebar({ userRole, userName = 'Admin' }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const superAdminMenuItems = [
    {
      title: 'Overview',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Manage Cars',
      href: '/dashboard/admin?tab=cars',
      icon: Car,
    },
    {
      title: 'Manage Users',
      href: '/dashboard/admin?tab=users',
      icon: Users,
    },
    {
      title: 'Manage Bookings',
      href: '/dashboard/admin?tab=bookings',
      icon: Barcode,
    },
    {
      title: 'Analytics',
      href: '/dashboard/admin?tab=analytics',
      icon: TrendingUp,
    },
  ]

  const facilitatorMenuItems = [
    {
      title: 'Overview',
      href: '/dashboard/facilitator',
      icon: LayoutDashboard,
    },
    {
      title: 'Assigned Cars',
      href: '/dashboard/facilitator?tab=cars',
      icon: Car,
    },
    {
      title: 'Booking Tracking',
      href: '/dashboard/facilitator?tab=bookings',
      icon: Barcode,
    },
    {
      title: 'Return Car',
      href: '/dashboard/facilitator?tab=return',
      icon: RotateCcw,
    },
  ]

  const menuItems = userRole === 'super_admin' ? superAdminMenuItems : facilitatorMenuItems

  const isActive = (href: string) => {
    return pathname === href || pathname.includes(href)
  }

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-bold text-sm">J</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">JamboDrive</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole === 'super_admin' ? 'Super Admin' : 'Facilitator'}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu>
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="transition-all duration-200"
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border px-3 py-4">
        <div className="flex flex-col gap-3">
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground mb-1">Logged in as</p>
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={() => (window.location.href = '/')}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </SidebarFooter>

      <SidebarTrigger className="absolute -right-12 top-4" />
    </Sidebar>
  )
}
