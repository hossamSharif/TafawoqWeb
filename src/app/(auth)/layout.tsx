import { Logo } from '@/components/shared/Logo'
import { brand } from '@/lib/brand'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Logo size="md" href="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <p>© {brand.legal.copyrightYear} {brand.name.arabic}. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  )
}
