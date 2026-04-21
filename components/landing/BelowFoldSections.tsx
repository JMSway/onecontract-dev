'use client'

import dynamic from 'next/dynamic'

const ProblemSection    = dynamic(() => import('./ProblemSection').then(m => ({ default: m.ProblemSection })))
const SolutionSection   = dynamic(() => import('./SolutionSection').then(m => ({ default: m.SolutionSection })))
const TrustSection      = dynamic(() => import('./TrustSection').then(m => ({ default: m.TrustSection })))
const HowItWorksSection = dynamic(() => import('./HowItWorksSection').then(m => ({ default: m.HowItWorksSection })))
const PricingSection    = dynamic(() => import('./PricingSection').then(m => ({ default: m.PricingSection })))
const CtaSection        = dynamic(() => import('./CtaSection').then(m => ({ default: m.CtaSection })))
const Footer            = dynamic(() => import('../layout/Footer').then(m => ({ default: m.Footer })))

export function BelowFoldSections() {
  return (
    <>
      <ProblemSection />
      <SolutionSection />
      <TrustSection />
      <HowItWorksSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </>
  )
}
