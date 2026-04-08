'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BadgeStatus } from '@/components/common/badge-status'
import { Input } from '@/components/ui/input'
import { mockCars, mockBookings, mockUsers } from '@/lib/mock-data'
import {
  Package,
  RotateCcw,
  Search,
  MapPin,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function FacilitatorDashboardPage() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const currentUser = mockUsers.find((u) => u.role === 'facilitator')

  // Mock assigned cars (first 3 cars assigned to this facilitator)
  const assignedCarIds = mockCars.slice(0, 3).map((c) => c.id)
  const assignedCars = mockCars.filter((c) => assignedCarIds.includes(c.id))

  // Filter bookings for assigned cars
  const facilitatorBookings = mockBookings.filter((b) => assignedCarIds.includes(b.carId))

  const [searchQuery, setSearchQuery] = useState('')
  const [returnedCars, setReturnedCars] = useState<string[]>([])

  const inTransitBookings = facilitatorBookings.filter((b) => b.status === 'confirmed').length
  const completedReturns = returnedCars.length
  const pendingPickups = facilitatorBookings.filter((b) => b.status === 'pending').length

  const handleMarkReturned = (bookingId: string, carId: string) => {
    setReturnedCars([...returnedCars, carId])
  }

  const filteredBookings = facilitatorBookings.filter((booking) => {
    const matchesSearch =
      booking.carName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <SidebarProvider>
    <div className="flex h-screen bg-background">
      <DashboardSidebar userRole="facilitator" userName={currentUser?.name} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 overflow-auto">
          <main className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Facilitator Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Manage car operations, track bookings, and process returns
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Cars</p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {assignedCars.length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">In Transit</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{inTransitBookings}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Pickups</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{pendingPickups}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Returns</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{completedReturns}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Tabs Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Assigned Cars Section */}
                  <Card className="p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Assigned Cars</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {assignedCars.map((car) => (
                        <div
                          key={car.id}
                          className="border border-border rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                        >
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-full h-40 object-cover rounded-lg mb-3"
                          />
                          <h3 className="font-semibold text-foreground">{car.name}</h3>
                          <p className="text-sm text-muted-foreground">{car.model}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <Badge variant={car.available ? 'default' : 'secondary'}>
                              {car.available ? 'Available' : 'In Use'}
                            </Badge>
                            <span className="text-sm font-medium text-foreground">${car.price}/day</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Booking Tracking Tab */}
              {(activeTab === 'bookings' || activeTab === 'overview') && (
                <Card className="p-6 shadow-sm">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Booking Tracking</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by car name, customer, or booking ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="font-semibold">Booking ID</TableHead>
                          <TableHead className="font-semibold">Car</TableHead>
                          <TableHead className="font-semibold">Customer</TableHead>
                          <TableHead className="font-semibold">Pickup Date</TableHead>
                          <TableHead className="font-semibold">Return Date</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <TableRow
                              key={booking.id}
                              className="border-border hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium text-foreground">
                                #{booking.id.slice(0, 8).toUpperCase()}
                              </TableCell>
                              <TableCell className="text-foreground">{booking.carName}</TableCell>
                              <TableCell className="text-foreground">{booking.userName}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(booking.pickupDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(booking.returnDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <BadgeStatus status={booking.status} />
                              </TableCell>
                              <TableCell>
                                {booking.status === 'confirmed' && !returnedCars.includes(booking.carId) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkReturned(booking.id, booking.carId)}
                                    className="gap-1 text-xs"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    Mark Returned
                                  </Button>
                                )}
                                {returnedCars.includes(booking.carId) && (
                                  <Badge variant="default" className="bg-green-600">
                                    Returned
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No bookings found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}

              {/* Return Car Tab */}
              {activeTab === 'return' && (
                <Card className="p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-foreground mb-6">Process Car Return</h2>

                  {returnedCars.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground">Recently Returned Cars</h3>
                      {assignedCars
                        .filter((car) => returnedCars.includes(car.id))
                        .map((car) => (
                          <div
                            key={car.id}
                            className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-foreground">{car.name}</p>
                                <p className="text-sm text-muted-foreground">Successfully returned</p>
                              </div>
                            </div>
                            <Badge variant="default" className="bg-green-600">
                              Returned
                            </Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No cars marked as returned yet</p>
                      <p className="text-sm mt-2">Use the Booking Tracking tab to process returns</p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </main>
        </div>

        <Footer />
      </div>
    </div>
    </SidebarProvider>
  )
}
