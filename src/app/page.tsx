import { HeroSection } from '@/components/landing/HeroSection'
import { FeatureSection } from '@/components/landing/FeatureSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { Logo } from '@/components/shared/Logo'
import { brand } from '@/lib/brand'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" href="/" />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              إنشاء حساب
            </Link>
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
