export interface Car {
  id: string
  name: string
  model: string
  year: number
  price: number
  rating: number
  reviews: number
  image: string
  images: string[]
  type: 'sedan' | 'suv' | 'coupe' | 'hatchback' | 'truck'
  seats: number
  transmission: 'manual' | 'automatic'
  fuel: 'petrol' | 'diesel' | 'hybrid' | 'electric'
  fuelConsumption: string
  features: string[]
  description: string
  available: boolean
}

export interface Booking {
  id: string
  carId: string
  carName: string
  userId: string
  userName: string
  pickupDate: string
  returnDate: string
  pickupLocation: string
  returnLocation: string
  totalPrice: number
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  insurance: boolean
  additionalFeatures: string[]
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  profileImage: string
  role: 'customer' | 'super_admin' | 'facilitator'
  joinDate: string
  totalBookings: number
}

export interface Review {
  id: string
  carId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  date: string
}

// Mock Cars Data
export const mockCars: Car[] = [
  {
    id: '1',
    name: 'BMW 3 Series',
    model: '330i',
    year: 2024,
    price: 120,
    rating: 4.8,
    reviews: 124,
    image: '/hero/car1.jpg',
    images: [
      '/hero/car2.jpg',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&h=600&fit=crop',
    ],
    type: 'sedan',
    seats: 5,
    transmission: 'automatic',
    fuel: 'petrol',
    fuelConsumption: '7.2L/100km',
    features: ['Air Conditioning', 'Leather Seats', 'Sunroof', 'Premium Sound System', 'Apple CarPlay', '4WD'],
    description: 'Experience luxury and performance with the BMW 3 Series. Perfect for business trips or weekend getaways. Features premium leather seats, advanced safety systems, and a powerful engine.',
    available: true,
  },
  {
    id: '2',
    name: 'Mercedes-Benz C-Class',
    model: 'C300',
    year: 2024,
    price: 135,
    rating: 4.9,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1553882900-d5160ca84f61?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1553882900-d5160ca84f61?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b83ad12?w=800&h=600&fit=crop',
    ],
    type: 'sedan',
    seats: 5,
    transmission: 'automatic',
    fuel: 'petrol',
    fuelConsumption: '7.5L/100km',
    features: ['Panoramic Sunroof', 'Heated Leather Seats', 'Premium Sound', 'Lane Keep Assist', 'Adaptive Cruise Control'],
    description: 'Ultimate luxury sedan with sophisticated German engineering. The C-Class delivers comfort, performance, and style for the discerning traveler.',
    available: true,
  },
  {
    id: '3',
    name: 'Toyota Land Cruiser',
    model: 'LC300',
    year: 2024,
    price: 150,
    rating: 4.7,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1606611013016-969c19d4a42f?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606611013016-969c19d4a42f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-35acde7260c3?w=800&h=600&fit=crop',
    ],
    type: 'suv',
    seats: 7,
    transmission: 'automatic',
    fuel: 'diesel',
    fuelConsumption: '9.2L/100km',
    features: ['All-Terrain Capability', '7 Seats', 'Advanced Safety Suite', 'Panoramic Sunroof', 'Navigation System', '4WD'],
    description: 'The ultimate adventure vehicle. Toyota Land Cruiser combines rugged capability with luxury. Perfect for family trips or off-road exploration.',
    available: true,
  },
  {
    id: '4',
    name: 'Audi Q5',
    model: 'SQ5',
    year: 2023,
    price: 128,
    rating: 4.6,
    reviews: 87,
    image: 'https://images.unsplash.com/photo-1606606301614-969c19d4a42f?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606606301614-969c19d4a42f?w=800&h=600&fit=crop',
    ],
    type: 'suv',
    seats: 5,
    transmission: 'automatic',
    fuel: 'petrol',
    fuelConsumption: '8.1L/100km',
    features: ['Quattro AWD', 'Premium Leather', 'Panoramic Roof', 'Matrix LEDs', 'Bang & Olufsen Sound'],
    description: 'Audi Q5 SQ5 combines versatility with performance. Ideal for families seeking comfort and style with dynamic handling.',
    available: true,
  },
  {
    id: '5',
    name: 'Porsche 911',
    model: 'Carrera',
    year: 2024,
    price: 250,
    rating: 5,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop',
    ],
    type: 'coupe',
    seats: 2,
    transmission: 'automatic',
    fuel: 'petrol',
    fuelConsumption: '10.5L/100km',
    features: ['Twin-Turbo Engine', 'Sport Suspension', 'Carbon Ceramic Brakes', 'Premium Bucket Seats', 'Navigation Pro'],
    description: 'Experience the thrill of driving a Porsche 911. A legendary sports car delivering unmatched performance and prestige.',
    available: false,
  },
  {
    id: '6',
    name: 'Honda CR-V',
    model: 'EX',
    year: 2023,
    price: 85,
    rating: 4.5,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1606366174000-cb5c96ee94d0?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606366174000-cb5c96ee94d0?w=800&h=600&fit=crop',
    ],
    type: 'suv',
    seats: 5,
    transmission: 'automatic',
    fuel: 'petrol',
    fuelConsumption: '8.2L/100km',
    features: ['Honda Sensing Safety', 'Spacious Cargo', 'Backup Camera', 'Bluetooth Audio', 'Heated Seats'],
    description: 'Reliable and spacious, the CR-V is perfect for families and road trips. Great fuel economy and impressive safety features.',
    available: true,
  },
  {
    id: '7',
    name: 'Tesla Model 3',
    model: 'Long Range',
    year: 2024,
    price: 110,
    rating: 4.9,
    reviews: 178,
    image: 'https://images.unsplash.com/photo-1615162697292-7ac56d7f7f1e?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1615162697292-7ac56d7f7f1e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560958089-b8a46dd52c58?w=800&h=600&fit=crop',
    ],
    type: 'sedan',
    seats: 5,
    transmission: 'automatic',
    fuel: 'electric',
    fuelConsumption: '16 kWh/100km',
    features: ['Autopilot', '300+ Mile Range', 'Fast Charging', 'Premium Interior', 'Performance Mode'],
    description: 'The future of driving. Tesla Model 3 offers incredible performance, technology, and zero emissions. Perfect for eco-conscious travelers.',
    available: true,
  },
  {
    id: '8',
    name: 'Lexus RX 350',
    model: 'Luxury',
    year: 2024,
    price: 140,
    rating: 4.8,
    reviews: 132,
    image: 'https://images.unsplash.com/photo-1548744432-abc2947edc6f?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1548744432-abc2947edc6f?w=800&h=600&fit=crop',
    ],
    type: 'suv',
    seats: 5,
    transmission: 'automatic',
    fuel: 'hybrid',
    fuelConsumption: '6.8L/100km',
    features: ['Hybrid Engine', 'Luxury Interior', 'Mark Levinson Audio', 'Panoramic Roof', 'Pre-Collision System'],
    description: 'Lexus luxury meets practical SUV design. The RX 350 delivers premium comfort, reliability, and efficiency.',
    available: true,
  },
  {
    id: '9',
    name: 'Chevrolet Silverado',
    model: '1500',
    year: 2023,
    price: 95,
    rating: 4.4,
    reviews: 92,
    image: 'https://images.unsplash.com/photo-1533473359331-35acde7260c3?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1533473359331-35acde7260c3?w=800&h=600&fit=crop',
    ],
    type: 'truck',
    seats: 5,
    transmission: 'automatic',
    fuel: 'diesel',
    fuelConsumption: '9.5L/100km',
    features: ['Max Towing', 'Spacious Bed', 'Integrated Bed Lighting', 'Backup Camera', 'Remote Start'],
    description: 'Power and capability in a full-size truck. Perfect for hauling, towing, and serious work.',
    available: true,
  },
  {
    id: '10',
    name: 'Mini Cooper',
    model: 'S',
    year: 2024,
    price: 75,
    rating: 4.6,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1590362891990-f8023e937541?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1590362891990-f8023e937541?w=800&h=600&fit=crop',
    ],
    type: 'hatchback',
    seats: 4,
    transmission: 'automatic',
    fuel: 'petrol',
    fuelConsumption: '6.5L/100km',
    features: ['Fun to Drive', 'Iconic Design', 'Smart Tech', 'Compact Parking', 'Great Fuel Efficiency'],
    description: 'The iconic Mini Cooper S brings character and agility to city driving. Perfect for urban adventures.',
    available: true,
  },
  {
    id: '11',
    name: 'Volkswagen Golf',
    model: 'GTI',
    year: 2023,
    price: 80,
    rating: 4.5,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1566023967268-de5d440fccc4?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1566023967268-de5d440fccc4?w=800&h=600&fit=crop',
    ],
    type: 'hatchback',
    seats: 5,
    transmission: 'automatic',
    fuel: 'petrol',
    fuelConsumption: '7.2L/100km',
    features: ['Turbocharged Engine', 'Sport Suspension', 'Touch Screen', 'Bluetooth', 'Red Stitching Interior'],
    description: 'The VW Golf GTI offers performance and practicality. A driver\'s car with everyday usability.',
    available: true,
  },
  {
    id: '12',
    name: 'Range Rover',
    model: 'Sport',
    year: 2024,
    price: 180,
    rating: 4.9,
    reviews: 88,
    image: 'https://images.unsplash.com/photo-1533473359331-35acde7260c3?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1533473359331-35acde7260c3?w=800&h=600&fit=crop',
    ],
    type: 'suv',
    seats: 5,
    transmission: 'automatic',
    fuel: 'diesel',
    fuelConsumption: '8.9L/100km',
    features: ['Terrain Response', 'Premium Leather', 'Panoramic Sunroof', 'Meridian Audio', 'Adaptive Dynamics'],
    description: 'British engineering meets luxury performance. Range Rover Sport is built for those who demand excellence.',
    available: true,
  },
]

// Mock Bookings Data
export const mockBookings: Booking[] = [
  {
    id: 'BK001',
    carId: '1',
    carName: 'BMW 3 Series',
    userId: 'U001',
    userName: 'John Doe',
    pickupDate: '2024-04-15',
    returnDate: '2024-04-18',
    pickupLocation: 'Downtown Branch',
    returnLocation: 'Downtown Branch',
    totalPrice: 360,
    status: 'confirmed',
    insurance: true,
    additionalFeatures: ['GPS Navigation', 'Child Seat'],
    createdAt: '2024-04-10',
  },
  {
    id: 'BK002',
    carId: '3',
    carName: 'Toyota Land Cruiser',
    userId: 'U002',
    userName: 'Jane Smith',
    pickupDate: '2024-04-20',
    returnDate: '2024-04-25',
    pickupLocation: 'Airport Branch',
    returnLocation: 'Airport Branch',
    totalPrice: 750,
    status: 'confirmed',
    insurance: true,
    additionalFeatures: ['Roof Rack', 'Extra Fuel Tank'],
    createdAt: '2024-04-08',
  },
  {
    id: 'BK003',
    carId: '7',
    carName: 'Tesla Model 3',
    userId: 'U001',
    userName: 'John Doe',
    pickupDate: '2024-04-22',
    returnDate: '2024-04-23',
    pickupLocation: 'Downtown Branch',
    returnLocation: 'Downtown Branch',
    totalPrice: 110,
    status: 'pending',
    insurance: false,
    additionalFeatures: [],
    createdAt: '2024-04-12',
  },
  {
    id: 'BK004',
    carId: '2',
    carName: 'Mercedes-Benz C-Class',
    userId: 'U003',
    userName: 'Michael Brown',
    pickupDate: '2024-03-28',
    returnDate: '2024-03-30',
    pickupLocation: 'Downtown Branch',
    returnLocation: 'Downtown Branch',
    totalPrice: 270,
    status: 'completed',
    insurance: true,
    additionalFeatures: ['Premium Cleaning'],
    createdAt: '2024-03-20',
  },
  {
    id: 'BK005',
    carId: '6',
    carName: 'Honda CR-V',
    userId: 'U002',
    userName: 'Jane Smith',
    pickupDate: '2024-04-01',
    returnDate: '2024-04-05',
    pickupLocation: 'Airport Branch',
    returnLocation: 'Downtown Branch',
    totalPrice: 340,
    status: 'completed',
    insurance: false,
    additionalFeatures: ['Roof Rack'],
    createdAt: '2024-03-25',
  },
  {
    id: 'BK006',
    carId: '8',
    carName: 'Lexus RX 350',
    userId: 'U004',
    userName: 'Sarah Wilson',
    pickupDate: '2024-04-16',
    returnDate: '2024-04-19',
    pickupLocation: 'Downtown Branch',
    returnLocation: 'Airport Branch',
    totalPrice: 420,
    status: 'confirmed',
    insurance: true,
    additionalFeatures: ['GPS Navigation', 'Premium Cleaning'],
    createdAt: '2024-04-11',
  },
]

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: 'U001',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    role: 'customer',
    joinDate: '2023-01-15',
    totalBookings: 12,
  },
  {
    id: 'U002',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '+1 (555) 234-5678',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    role: 'customer',
    joinDate: '2023-03-22',
    totalBookings: 8,
  },
  {
    id: 'U003',
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    phone: '+1 (555) 345-6789',
    profileImage: 'https://images.unsplash.com/photo-1507009349169-2f002535a138?w=150&h=150&fit=crop',
    role: 'customer',
    joinDate: '2023-05-10',
    totalBookings: 5,
  },
  {
    id: 'U004',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@email.com',
    phone: '+1 (555) 456-7890',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    role: 'customer',
    joinDate: '2023-07-08',
    totalBookings: 15,
  },
  {
    id: 'ADMIN001',
    name: 'Admin User',
    email: 'admin@jambodrives.com',
    phone: '+1 (555) 999-0000',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    role: 'super_admin',
    joinDate: '2022-01-01',
    totalBookings: 0,
  },
  {
    id: 'FAC001',
    name: 'Facilitator User',
    email: 'facilitator@jambodrives.com',
    phone: '+1 (555) 888-0000',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    role: 'facilitator',
    joinDate: '2023-06-01',
    totalBookings: 0,
  },
]

// Mock Reviews Data
export const mockReviews: Review[] = [
  {
    id: 'R001',
    carId: '1',
    userId: 'U001',
    userName: 'John Doe',
    rating: 5,
    title: 'Excellent car, smooth ride',
    comment: 'The BMW 3 Series was in perfect condition. Very comfortable for long drives and great customer service.',
    date: '2024-03-20',
  },
  {
    id: 'R002',
    carId: '1',
    userId: 'U003',
    userName: 'Michael Brown',
    rating: 4,
    title: 'Great choice for business travel',
    comment: 'Professional looking car, all amenities working perfectly. Would rent again.',
    date: '2024-03-15',
  },
  {
    id: 'R003',
    carId: '3',
    userId: 'U002',
    userName: 'Jane Smith',
    rating: 5,
    title: 'Perfect for adventure',
    comment: 'Toyota Land Cruiser is a beast! Handled off-road driving with ease. Highly recommend for adventurers.',
    date: '2024-02-28',
  },
  {
    id: 'R004',
    carId: '7',
    userId: 'U004',
    userName: 'Sarah Wilson',
    rating: 5,
    title: 'Amazing electric experience',
    comment: 'Tesla Model 3 is the future! Silent, smooth, and impressive acceleration. Great for eco-conscious travelers.',
    date: '2024-02-15',
  },
  {
    id: 'R005',
    carId: '2',
    userId: 'U001',
    userName: 'John Doe',
    rating: 5,
    title: 'Luxury redefined',
    comment: 'Mercedes C-Class exceeded expectations. Premium features and pristine condition.',
    date: '2024-01-30',
  },
]
