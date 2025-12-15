'use client'

import { brand } from '@/lib/brand'
import {
  Brain,
  Library,
  Users,
  Target,
  Gift,
  BarChart,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Brain,
  Library,
  Users,
  Target,
  Gift,
  BarChart,
}

export function FeatureSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            كل ما تحتاجه للتفوق في اختبار القدرات
          </h2>
          <p className="text-muted-foreground text-lg">
            أدوات متقدمة ومحتوى شامل يساعدك على تحقيق أعلى الدرجات
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {brand.features.map((feature) => {
            const Icon = iconMap[feature.icon]
            return (
              <div
                key={feature.id}
                className="group p-8 rounded-2xl bg-background border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  {Icon && <Icon className="h-7 w-7 text-primary group-hover:text-white" />}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.titleAr}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.descriptionAr}
                </p>
              </div>
            )
          })}
        </div>

        {/* Additional highlight */}
        <div className="mt-16 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              شارك محتواك واكسب مكافآت
            </h3>
            <p className="text-muted-foreground text-lg mb-6">
              عندما يستفيد الآخرون من اختباراتك المشاركة، تحصل على نقاط إضافية
              لإنشاء المزيد من الاختبارات. كلما شاركت أكثر، استفدت أكثر!
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="px-4 py-2 rounded-full bg-background border">
                شارك اختبارك
              </div>
              <span className="flex items-center text-muted-foreground">←</span>
              <div className="px-4 py-2 rounded-full bg-background border">
                آخرون يحلون اختبارك
              </div>
              <span className="flex items-center text-muted-foreground">←</span>
              <div className="px-4 py-2 rounded-full bg-primary text-white">
                تحصل على مكافأة
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
