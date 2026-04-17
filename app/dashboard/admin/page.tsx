'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BadgeStatus } from '@/components/common/badge-status'
import { CarModal } from '@/components/modals/car-modal'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase-client'
import { DatabaseService } from '@/lib/services'
import type { Car, Booking, User } from '@/lib/mock-data'
import { 
  Users, DollarSign, Calendar, Car as CarIcon, 
  Search, Plus, Edit, Trash2, MessageCircle, 
  MoreVertical, Filter
} from 'lucide-react'
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
    toast.success("Car removed successfully")
  }

  const refreshCars = () => {
    db.getCars().then(setCars).catch(console.error)
  }

  useEffect(() => {
    db.getCars().then(setCars).catch(console.error)
    db.getBookings().then(setBookings).catch(console.error)
    db.getProfiles().then(setUsers).catch(console.error) 
  }, [])

  const totalCars = cars.length
  const totalBookings = bookings.length
  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0)
  const totalUsers = users.filter((u) => u.role === 'customer').length

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.car?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 overflow-auto">
          <main className="p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* HEADER */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Super Admin</h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    Manage your fleet, users, and bookings.
                  </p>
                </div>
              </div>

              {/* STATS GRID - 2x2 on mobile, 4x1 on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { icon: Calendar, label: 'Bookings', value: totalBookings, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                  { icon: DollarSign, label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
                  { icon: CarIcon, label: 'Fleet', value: totalCars, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                  { icon: Users, label: 'Customers', value: totalUsers, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <Card key={i} className="p-4 sm:p-6 shadow-sm border-none bg-white dark:bg-card rounded-2xl">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                        </div>
                        <div className={`p-2 sm:p-3 rounded-full ${stat.bg} hidden sm:flex`}>
                          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* BOOKINGS MANAGEMENT */}
              <Card className="shadow-sm border-none bg-white dark:bg-card rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Recent Bookings</h2>
                    <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      New Booking
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search ID, customer, or car..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl h-11"
                      />
                    </div>
                    <div className="relative min-w-[140px]">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 h-11 border-none rounded-xl bg-slate-50 dark:bg-slate-900/50 text-foreground text-sm focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                      >
                        <option value="">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="font-semibold whitespace-nowrap pl-6">ID</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">Vehicle</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">Customer</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">Dates</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">Amount</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap">Status</TableHead>
                        <TableHead className="font-semibold whitespace-nowrap pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <TableRow key={booking.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <TableCell className="font-medium text-foreground whitespace-nowrap pl-6">
                              #{booking.id.slice(0, 6).toUpperCase()}
                            </TableCell>
                            <TableCell className="text-foreground whitespace-nowrap">{booking.cars?.name}</TableCell>
                            <TableCell className="text-foreground whitespace-nowrap">{booking.profiles?.full_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(booking.pickup_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(booking.return_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground whitespace-nowrap">${booking.total_price}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <BadgeStatus status={booking.status} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap pr-6">
                              <div className="flex gap-2">
                                {booking.status === 'pending' ? (
                                  <>
                                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3 rounded-lg" onClick={() => handleBookingStatus(booking.id, 'confirmed')}>
                                      Approve
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 px-3 rounded-lg" onClick={() => handleBookingStatus(booking.id, 'cancelled')}>
                                      Reject
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground px-2">Processed</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Search className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                              <p>No bookings found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* USER MANAGEMENT */}
              <Card className="p-4 sm:p-6 shadow-sm border-none bg-white dark:bg-card rounded-2xl">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground">User Directory</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {users.map((user) => (
                    <div key={user.id} className="group border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all duration-200 hover:shadow-md hover:border-accent/30 bg-slate-50/50 dark:bg-slate-900/20">
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                          {user.profile_image ? (
                            <Image src={user.profile_image} alt={user.full_name ?? ''} fill className="object-cover" />
                          ) : (
                            <Users className="h-6 w-6 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{user.full_name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold bg-white dark:bg-slate-900">
                              {user.role?.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {user.total_bookings} trips
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons - full width on mobile, auto on desktop */}
                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
                        <Button
                          size="sm"
                          className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2 rounded-xl shadow-sm"
                          onClick={() => handleWhatsApp(user.phone ?? '')}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Button>
                        <select
                          value={user.role ?? 'customer'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="flex-1 sm:flex-none text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-foreground focus:ring-2 focus:ring-accent/50 cursor-pointer"
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

              {/* FLEET MANAGEMENT */}
              <Card className="p-4 sm:p-6 shadow-sm border-none bg-white dark:bg-card rounded-2xl">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-foreground">Fleet Management</h2>
                  <Button onClick={handleAddCar} className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 dark:bg-white dark:text-black rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cars.slice(0, 6).map((car) => (
                    <div key={car.id} className="group rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <div className="relative h-48 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                        <img src={car.image} alt={car.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute top-3 right-3">
                          <Badge className={`${car.available ? 'bg-white/90 text-black' : 'bg-black/80 text-white'} backdrop-blur-sm border-none shadow-sm`}>
                            {car.available ? 'Available' : 'Rented'}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg text-foreground leading-tight">{car.name}</h3>
                            <p className="text-sm text-muted-foreground">{car.model}</p>
                          </div>
                          <p className="font-bold text-accent">${car.price}<span className="text-xs text-muted-foreground font-normal">/d</span></p>
                        </div>
                        
                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent" onClick={() => handleEditCar(car)}>
                            <Edit className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-transparent" onClick={() => handleDeleteCar(car.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
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
