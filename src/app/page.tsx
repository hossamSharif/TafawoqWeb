'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeatureSection } from '@/components/landing/FeatureSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { Logo } from '@/components/shared/Logo'
import { brand } from '@/lib/brand'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star } from 'lucide-react'

// Mark this page as dynamic to support client-side auth
export const dynamic = 'force-dynamic'

export default function LandingPage() {
  const { isAuthenticated, isPremium, isLoading } = useAuth()
  const router = useRouter()

  // Non-blocking redirect: only redirect after auth is loaded, but show content immediately
  useEffect(() => {
    if (!isLoading && isAuthenticated && isPremium) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isPremium, isLoading, router])

  // Don't block rendering - show content immediately
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" href="/" />
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="px-6 py-3 text-base font-semibold h-auto rounded-xl gap-2"
                >
                  <Link href="/reviews">
                    <Star className="h-4 w-4" />
                    التقييمات
                  </Link>
                </Button>
                <Link
                  href="/dashboard"
                  className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-primary rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 glow-button"
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-green-400 to-primary bg-[length:200%_100%] animate-glow-border opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute inset-[2px] rounded-[10px] bg-primary z-[1]" />
                  <span className="relative z-[2] flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4 animate-bounce-horizontal" />
                    <span>انتقل إلى لوحة التحكم</span>
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="px-6 py-3 text-base font-semibold h-auto rounded-xl"
                >
                  <Link href="/login">تسجيل الدخول</Link>
                </Button>

                <Link
                  href="/register"
                  className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-primary rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 glow-button"
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-green-400 to-primary bg-[length:200%_100%] animate-glow-border opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute inset-[2px] rounded-[10px] bg-primary z-[1]" />
                  <span className="relative z-[2] flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4 animate-bounce-horizontal" />
                    <span>إنشاء حساب مجاني</span>
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-16">
        <HeroSection />
      </div>

      {/* Features Section */}
      <FeatureSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <Logo size="sm" showText={false} href="/" />
              <div>
                <p className="font-semibold">{brand.name.arabic}</p>
                <p className="text-sm text-muted-foreground">
                  {brand.name.meaning}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                الشروط والأحكام
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                سياسة الخصوصية
              </Link>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                تواصل معنا
              </Link>
            </div>

            <div className="text-sm text-muted-foreground">
              © {brand.legal.copyrightYear} {brand.legal.companyName}. جميع
              الحقوق محفوظة.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
