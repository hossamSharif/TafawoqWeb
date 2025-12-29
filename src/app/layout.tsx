import type { Metadata } from 'next'
import { Noto_Kufi_Arabic } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { brand } from '@/lib/brand'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: brand.meta.title,
  description: brand.meta.description,
  keywords: [...brand.meta.keywords],
  openGraph: {
    title: brand.meta.title,
    description: brand.meta.description,
    siteName: brand.name.full,
    locale: 'ar_SA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={notoKufiArabic.variable}>
      <body className={`${notoKufiArabic.className} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors dir="rtl" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
