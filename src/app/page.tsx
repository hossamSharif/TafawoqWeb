import Link from 'next/link'

export default function WelcomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-primary">
            تفوق
          </h1>
          <p className="text-xl text-muted-foreground">
            منصة التحضير لاختبار القدرات العامة
          </p>
        </div>

        {/* Hero Description */}
        <div className="space-y-4 arabic-text">
          <p className="text-lg">
            استعد لاختبار القدرات العامة مع منصة تفوق. اختبارات تجريبية متكاملة،
            تمارين مخصصة، وتحليلات أداء شاملة لمساعدتك على تحقيق أعلى الدرجات.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
          <div className="p-6 rounded-lg bg-white shadow-sm border border-border">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-semibold mb-2">اختبارات تجريبية</h3>
            <p className="text-sm text-muted-foreground">
              96 سؤال في 120 دقيقة تحاكي الاختبار الحقيقي
            </p>
          </div>
          <div className="p-6 rounded-lg bg-white shadow-sm border border-border">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">تمارين مخصصة</h3>
            <p className="text-sm text-muted-foreground">
              اختر القسم والفئة ومستوى الصعوبة
            </p>
          </div>
          <div className="p-6 rounded-lg bg-white shadow-sm border border-border">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold mb-2">تحليل الأداء</h3>
            <p className="text-sm text-muted-foreground">
              تعرف على نقاط قوتك وضعفك
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/auth/register"
            className="px-8 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            إنشاء حساب جديد
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold text-lg hover:bg-primary/10 transition-colors"
          >
            تسجيل الدخول
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-sm text-muted-foreground pt-8">
          مسار علمي ومسار أدبي • أسئلة مولدة بالذكاء الاصطناعي • شروحات تفصيلية
        </p>
      </div>
    </main>
  )
}
