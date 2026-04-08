'use client'

import { Suspense } from 'react'
import FacilitatorDashboardContent from './FacilitatorDashboardContent'

export default function FacilitatorDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <FacilitatorDashboardContent />
    </Suspense>
  )
}
