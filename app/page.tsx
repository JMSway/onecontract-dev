import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { SolutionSection } from '@/components/landing/SolutionSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CtaSection } from '@/components/landing/CtaSection'

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Problem */}
        <ProblemSection />

        {/* 3. Solution */}
        <SolutionSection />

        {/* 4. Social proof / Testimonials */}
        <TestimonialsSection />

        {/* 5. How it works + video */}
        <HowItWorksSection />

        {/* 6. Pricing */}
        <PricingSection />

        {/* 7. Final CTA */}
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
