import type { Metadata } from 'next'
import { Noto_Kufi_Arabic } from 'next/font/google'
import './globals.css'

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'تفوق - منصة التحضير لاختبار القدرات',
  description: 'منصة متكاملة للتحضير لاختبار القدرات العامة للطلاب السعوديين',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={notoKufiArabic.variable}>
      <body className={`${notoKufiArabic.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
