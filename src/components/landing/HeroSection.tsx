'use client'

import { AppShowcaseSection } from './AppShowcaseSection'
// import { AnimatedBackground } from './AnimatedBackground'

export function HeroSection() {

  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden">
      {/* White background base - z-0 (lowest layer) */}
      <div className="absolute inset-0 bg-white z-0" />

      {/* Top Animated Green Particles - z-[1] (above white, below content) */}
      {/* <AnimatedBackground /> */}

      {/* Subtle decorative elements - z-[2] */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl z-[2]" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-[2]" />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Main heading */}
          <h1 className="animate-fade-up delay-200 text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            إستعد لإمتحان القدرات بذكاء
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up delay-300 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            أنشئ اختبارك الخاص • حل واحصل على شروحات فورية • استكشف مكتبة الاختبارات المشتركة • شارك اختباراتك واكسب مكافآت
          </p>

          {/* Trust indicators */}
          <div className="animate-fade-up delay-500 flex flex-wrap justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>مسار علمي وأدبي</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>أسئلة مولدة بالذكاء الاصطناعي</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>شروحات تفصيلية</span>
            </div>
          </div>
        </div>
      </div>

      {/* App Showcase - Integrated into Hero */}
      <div className="relative z-10 w-full mt-4">
        <AppShowcaseSection />
      </div>
    </section>
  )
}
