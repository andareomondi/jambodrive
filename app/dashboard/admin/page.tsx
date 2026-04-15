'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BadgeStatus } from '@/components/common/badge-status'
import { CarModal } from '@/components/modals/car-modal'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase-client'
import { DatabaseService } from '@/lib/services'
import type { Car, Booking, User } from '@/lib/mock-data'
import { Users, DollarSign, Calendar, Car as CarIcon, Search, Plus, Edit, Trash2, MessageCircle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function AdminDashboardPage() {

const supabase = createClient()
const db = new DatabaseService(supabase)

const [cars, setCars] = useState<Car[]>([])
const [bookings, setBookings] = useState<Booking[]>([])
const [users, setUsers] = useState<User[]>([])
const [carModalOpen, setCarModalOpen] = useState(false)
const [selectedCar, setSelectedCar] = useState<Car | null>(null)
const [searchQuery, setSearchQuery] = useState('')
const [statusFilter, setStatusFilter] = useState<string>('')


const handleBookingStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
  if (error) { toast.error(error.message); return }
  toast.success(`Booking ${status === 'confirmed' ? 'confirmed' : 'rejected'}.`)
  setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b))
}

const handleRoleChange = async (userId: string, role: string) => {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) { toast.error(error.message); return }
  toast.success('Role updated.')
  setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
}

const handleWhatsApp = (phone: string) => {
  const number = phone?.replace(/\D/g, '')
  const message = encodeURIComponent('Hello, this is the admin from Cozy Mobility Tours.')
  window.open(`https://wa.me/${number}?text=${message}`, '_blank')
}

const handleAddCar = () => {
  setSelectedCar(null)
  setCarModalOpen(true)
}

const handleEditCar = (car: Car) => {
  setSelectedCar(car)
  setCarModalOpen(true)
}

const handleDeleteCar = async (id: string) => {
  await db.deleteCar(id)
  setCars((prev) => prev.filter((c) => c.id !== id))
}

const refreshCars = () => {
  db.getCars().then(setCars).catch(console.error)
}

useEffect(() => {
  db.getCars().then(setCars).catch(console.error)
  db.getBookings().then(setBookings).catch(console.error)
  db.getProfiles().then(setUsers).catch(console.error) 
}, [])

// Update your stats to use state instead of mock:
const totalCars = cars.length
const totalBookings = bookings.length
const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0)
const totalUsers = users.filter((u) => u.role === 'customer').length

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.car?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

      // <DashboardSidebar userRole="super_admin" userName={currentUser?.name} />
  return (
    <div className="flex h-screen bg-background">

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 overflow-auto">
          <main className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Manage cars, users, bookings, and view analytics
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { icon: Calendar, label: 'Total Bookings', value: totalBookings, color: 'text-blue-500' },
                  { icon: DollarSign, label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'text-green-500' },
                  { icon: CarIcon, label: 'Fleet Size', value: totalCars, color: 'text-purple-500' },
                  { icon: Users, label: 'Active Users', value: totalUsers, color: 'text-orange-500' },
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <Card key={i} className="p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        </div>
                        <Icon className={`w-8 h-8 opacity-20 ${stat.color}`} />
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Bookings Management */}
              <Card className="p-6 shadow-sm">
                <div className="mb-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Manage Bookings</h2>
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                      <Plus className="h-4 w-4" />
                      New Booking
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by car, customer, or booking ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-input rounded-md bg-background text-foreground transition-all duration-200 hover:border-border focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="font-semibold">ID</TableHead>
                        <TableHead className="font-semibold">Vehicle</TableHead>
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Pickup Date</TableHead>
                        <TableHead className="font-semibold">Return Date</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <TableRow key={booking.id} className="border-border hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium text-foreground">
                              #{booking.id.slice(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell className="text-foreground">{booking.cars?.name}</TableCell>
                            <TableCell className="text-foreground">{booking.profiles?.full_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(booking.pickup_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(booking.return_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-semibold text-accent">${booking.total_price}</TableCell>
                            <TableCell>
                              <BadgeStatus status={booking.status} />
                            </TableCell>
<TableCell>
  <div className="flex gap-2">
    {booking.status === 'pending' && (
      <>
        <Button
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white h-8 px-3 text-xs"
          onClick={() => handleBookingStatus(booking.id, 'confirmed')}
        >
          Confirm
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive hover:bg-destructive/10 h-8 px-3 text-xs"
          onClick={() => handleBookingStatus(booking.id, 'cancelled')}
        >
          Reject
        </Button>
      </>
    )}
    {booking.status !== 'pending' && (
      <BadgeStatus status={booking.status} />
    )}
  </div>
</TableCell>

                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No bookings found matching your criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>


<Card className="p-6 shadow-sm">
  <div className="mb-6 flex items-center justify-between">
    <h2 className="text-lg font-semibold text-foreground">User Management</h2>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {users.map((user) => (
      <div key={user.id} className="border border-border rounded-lg p-4 flex items-start gap-4 transition-all duration-200 hover:shadow-md">
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-accent/10 flex items-center justify-center">
          {user.profile_image ? (
            <Image src={user.profile_image ?? 'https://github.com/andareomondi/jambodrive/blob/main/public/default.png'} alt={user.full_name ?? ''} fill className="object-cover" />
          ) : (
            <Users className="h-6 w-6 text-accent" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{user.full_name}</h3>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">{user.phone}</p>
          <p className="text-xs text-muted-foreground">
            Joined: {user.join_date ? new Date(user.join_date).toLocaleDateString() : '—'}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs capitalize">
              {user.role?.replace(/_/g, ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground">{user.total_bookings} bookings</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white gap-1 text-xs"
            onClick={() => handleWhatsApp(user.phone ?? '')}
          >
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </Button>
          <select
            value={user.role ?? 'customer'}
            onChange={(e) => handleRoleChange(user.id, e.target.value)}
            className="text-xs px-2 py-1 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
          >
            <option value="customer">Customer</option>
            <option value="facilitator">Facilitator</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>
    ))}
  </div>
</Card>
              {/* Cars Management */}
              <Card className="p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Fleet Management</h2>
                  <Button onClick={handleAddCar} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                    <Plus className="h-4 w-4" />
                    Add Car
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cars.slice(0, 6).map((car) => (
                    <div key={car.id} className="border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
                      <img src={car.image} alt={car.name} className="w-full h-40 object-cover" />
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground">{car.name}</h3>
                        <p className="text-xs text-muted-foreground">{car.model}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">${car.price}/day</span>
                          <Badge variant={car.available ? 'default' : 'secondary'} className="text-xs">
                            {car.available ? 'Available' : 'In Use'}
                          </Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditCar(car)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive/80" onClick={() => handleDeleteCar(car.id)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </main>
        </div>

      </div>

      <CarModal          
        open={carModalOpen}
        onOpenChange={setCarModalOpen}
        car={selectedCar}
        onSuccess={refreshCars}
      />
    </div>
  )
}
