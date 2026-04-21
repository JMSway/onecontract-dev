import { Header } from '@/components/layout/Header'
import { StickyCtaBar } from '@/components/ui/StickyCtaBar'
import { HeroSection } from '@/components/landing/HeroSection'
import { BelowFoldSections } from '@/components/landing/BelowFoldSections'

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        {/* 1. Hero — dark, phone mockup (eager, above the fold) */}
        <HeroSection />

        {/* 2–7. Below the fold — lazy loaded client-side */}
        <BelowFoldSections />
      </main>

      {/* Mobile sticky CTA */}
      <StickyCtaBar />
    </>
  )
}
