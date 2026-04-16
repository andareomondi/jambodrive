'use client'

import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'

export default function TermsPage() {
  const sections = [
    {
      title: '1. Rental Agreement',
      content:
        'By renting a vehicle from JamboDrive, you agree to our rental terms and conditions. The driver must be at least 21 years old with a valid driver&apos;s license. We reserve the right to refuse rental to anyone who does not meet our requirements or poses a safety risk.',
    },
    {
      title: '2. Vehicle Condition & Inspection',
      content:
        'You must inspect the vehicle before leaving the lot and report any existing damage. You are responsible for all damage to the vehicle during your rental period, including interior and exterior damage. Minor wear and tear are covered, but significant damage may incur repair costs.',
    },
    {
      title: '3. Fuel Policy',
      content:
        'All vehicles are provided with a full tank of fuel. You must return the vehicle with a full tank of fuel. If the vehicle is returned with less fuel, you will be charged for fuel refill at premium rates plus a service fee.',
    },
    {
      title: '4. Mileage & Usage',
      content:
        'Unlimited mileage is included with all JamboDrive rentals. However, the vehicle must be used only for lawful purposes. Unauthorized use, off-road driving, or racing is strictly prohibited and may result in additional charges or legal action.',
    },
    {
      title: '5. Insurance & Liability',
      content:
        'You are responsible for maintaining valid insurance coverage on the rental vehicle. We offer optional insurance plans that can be purchased during checkout. JamboDrive is not liable for personal injury, loss of belongings, or loss of use of the vehicle.',
    },
    {
      title: '6. Late Returns & Extension Policy',
      content:
        'Late returns incur additional charges based on your rental agreement. Hourly rates apply for returns up to 24 hours late. Returns beyond 24 hours are charged at the daily rate. Contact support immediately if you anticipate a late return.',
    },
    {
      title: '7. Cancellation & Modification Policy',
      content:
        'Cancellations made 24 hours or more before pickup are refunded in full. Cancellations made within 24 hours of pickup may incur a cancellation fee. Confirmed bookings cannot be modified and must be cancelled and rebooked.',
    },
    {
      title: '8. Maintenance & Repairs',
      content:
        'Report any mechanical issues or maintenance concerns immediately. Do not attempt repairs yourself. We provide roadside assistance for mechanical issues. You are responsible for towing costs if damage results from negligent use.',
    },
    {
      title: '9. Traffic Violations & Fines',
      content:
        'You are responsible for all traffic violations, parking tickets, and tolls incurred during your rental period. JamboDrive may charge an administrative fee if we pay fines on your behalf. You must pay these fees within 30 days.',
    },
    {
      title: '10. Payment & Billing',
      content:
        'Payment is due in full at the time of pickup. We accept all major credit cards and digital payment methods. A security deposit is required and will be refunded within 10 business days after return if no damages or violations are found.',
    },
    {
      title: '11. Liability & Indemnification',
      content:
        'You agree to indemnify JamboDrive against all claims, damages, and losses resulting from your use of the rental vehicle. This includes third-party claims for injury or property damage. Our liability is limited to the replacement value of the vehicle.',
    },
    {
      title: '12. Termination of Rental Agreement',
      content:
        'JamboDrive reserves the right to terminate your rental agreement immediately if you violate these terms, drive under the influence, or operate the vehicle unsafely. Early termination charges will apply, and you may be held liable for any additional damages.',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-secondary/50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl text-balance">
              Please read our rental terms and conditions carefully before booking. By renting from JamboDrive, you agree to all terms listed below.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Last updated: April 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Introduction */}
            <Card className="p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-4">Agreement Overview</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These Terms and Conditions govern your rental of a vehicle from JamboDrive. By completing a rental transaction with JamboDrive, you are entering into a legally binding agreement. Please ensure you understand and accept all terms before confirming your booking.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                JamboDrive reserves the right to modify these terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services constitutes acceptance of any modifications.
              </p>
            </Card>

            {/* Terms Sections */}
            {sections.map((section, index) => (
              <Card key={index} className="p-6 md:p-8 shadow-sm">
                <h3 className="text-xl font-bold text-foreground mb-3">{section.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </Card>
            ))}

            {/* Additional Information */}
            <Card className="p-6 md:p-8 shadow-sm border-accent/20 bg-accent/5">
              <h3 className="text-xl font-bold text-foreground mb-4">Contact Information</h3>
              <p className="text-muted-foreground mb-3">
                For questions about these terms or our rental policies, please contact:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Email:</span> support@jambodrives.com
                </p>
                <p>
                  <span className="font-medium text-foreground">Phone:</span> +1 (555) 123-4567
                </p>
                <p>
                  <span className="font-medium text-foreground">Address:</span> 123 Auto Drive, City, State 12345
                </p>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
