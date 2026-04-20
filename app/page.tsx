import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StickyCtaBar } from '@/components/ui/StickyCtaBar'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { SolutionSection } from '@/components/landing/SolutionSection'
import { TrustSection } from '@/components/landing/TrustSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CtaSection } from '@/components/landing/CtaSection'

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        {/* 1. Hero — dark, phone mockup */}
        <HeroSection />

        {/* 2. Problem — 3 pain cards */}
        <ProblemSection />

        {/* 3. Solution — 3-step horizontal flow */}
        <SolutionSection />

        {/* 4. Trust — legal basis, dark bg */}
        <TrustSection />

        {/* 5. How it works — video placeholder */}
        <HowItWorksSection />

        {/* 6. Pricing — 2 tiers */}
        <PricingSection />

        {/* 7. Final CTA */}
        <CtaSection />
      </main>
      <Footer />

      {/* Mobile sticky CTA */}
      <StickyCtaBar />
    </>
  )
}
