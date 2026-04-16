'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I book a car?',
    answer:
      'Simply browse our car listings, select your desired vehicle, choose your pickup and return dates and locations, then proceed to checkout. You can book online or call our support team for assistance.',
  },
  {
    question: 'What documents do I need to rent a car?',
    answer:
      'You will need a valid government-issued ID, a valid driver&apos;s license, proof of insurance, and a credit card for the security deposit. International renters may need additional documentation.',
  },
  {
    question: 'Can I modify or cancel my booking?',
    answer:
      'You can modify or cancel your booking through your dashboard up to 24 hours before pickup. Cancellations made within 24 hours may incur fees. Confirmed bookings cannot be modified—you would need to cancel and rebook.',
  },
  {
    question: 'What is the age requirement for renting a car?',
    answer:
      'You must be at least 21 years old to rent from JamboDrive. Some premium vehicles may require you to be 25 years or older. A valid driver&apos;s license is required.',
  },
  {
    question: 'Do you offer insurance coverage?',
    answer:
      'Yes, we offer comprehensive insurance options including basic coverage, premium coverage with lower deductibles, and additional protection plans. Insurance can be added during the booking process.',
  },
  {
    question: 'What if I damage the car during my rental?',
    answer:
      'Minor damages may be covered under your insurance plan. Report any damage immediately to our support team. You may be charged for damages not covered by your insurance plan based on the extent of damage.',
  },
  {
    question: 'Can I extend my rental period?',
    answer:
      'Yes, you can extend your rental period through your dashboard if the vehicle is available. Extensions are subject to availability and may have different pricing. Contact support for assistance with long-term extensions.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital payment methods. A security deposit is required and will be refunded after vehicle return.',
  },
  {
    question: 'Is fuel included in the rental?',
    answer:
      'Rentals include a full tank of fuel. You must return the vehicle with a full tank as well. If the vehicle is returned with less than a full tank, you will be charged for fuel refill at standard rates.',
  },
  {
    question: 'What happens if I return the car late?',
    answer:
      'Late returns incur additional charges based on your rental agreement. We charge hourly rates for returns up to 24 hours late, and daily rates for returns beyond that. Contact support if you anticipate a late return.',
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-secondary/50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl text-balance">
              Find answers to common questions about renting with JamboDrive. Can&apos;t find what you&apos;re looking for? Contact our support team.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => toggleAccordion(index)}
                >
                  <div className="p-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                    <ChevronDown
                      className={`h-5 w-5 text-accent transition-transform duration-300 flex-shrink-0 ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {/* Accordion Content */}
                  {openIndex === index && (
                    <div className="px-6 pb-6 border-t border-border">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <Card className="mt-12 p-8 bg-accent/5 border-accent/20">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-3">Still have questions?</h3>
                <p className="text-muted-foreground mb-6">
                  Our support team is here to help. Get in touch with us anytime.
                </p>
                <a
                  href="/contact"
                  className="inline-block bg-accent hover:bg-accent/90 text-accent-foreground font-medium px-6 py-2 rounded-md transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
