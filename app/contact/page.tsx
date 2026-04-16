'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Message sent successfully! We will get back to you soon.')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-secondary/50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Get in Touch with Us
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl text-balance">
              Have questions about JamboDrive? We&apos;re here to help. Contact our support team and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Contact Info Cards */}
              {[
                {
                  icon: Phone,
                  title: 'Phone',
                  info: '+1 (555) 123-4567',
                  subtext: 'Available 9 AM - 6 PM EST',
                },
                {
                  icon: Mail,
                  title: 'Email',
                  info: 'support@jambodrives.com',
                  subtext: 'Response within 24 hours',
                },
                {
                  icon: MapPin,
                  title: 'Office',
                  info: '123 Auto Drive, City, State 12345',
                  subtext: 'Visit us during business hours',
                },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <Card key={i} className="p-6 shadow-sm hover:shadow-md transition-shadow">
                    <Icon className="h-8 w-8 text-accent mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-foreground font-medium mb-1">{item.info}</p>
                    <p className="text-sm text-muted-foreground">{item.subtext}</p>
                  </Card>
                )
              })}
            </div>

            {/* Contact Form */}
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-foreground mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="w-full transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="How can we help?"
                      className="w-full transition-all duration-200 focus:ring-2 focus:ring-accent/50"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your inquiry..."
                      rows={5}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
