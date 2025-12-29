'use client'

import { ContactForm } from '@/components/contact/ContactForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Clock } from 'lucide-react'

export default function ContactPage() {
  return (
    <main className="min-h-screen py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">تواصل معنا</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            نحن هنا لمساعدتك. أرسل لنا رسالتك وسنرد عليك في أقرب وقت ممكن
          </p>
        </div>

        {/* Contact Form Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info Sidebar */}
          <div className="md:col-span-1 space-y-4">
            {/* Contact Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات التواصل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                    <a
                      href="mailto:hossamsharif1990@gmail.com"
                      className="font-medium text-primary hover:underline break-all"
                    >
                      hossamsharif1990@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">وقت الاستجابة</p>
                    <p className="font-medium">نرد خلال 24-48 ساعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-primary">هل تحتاج مساعدة فورية؟</h3>
                <p className="text-sm text-muted-foreground">
                  يمكنك الاطلاع على الأسئلة الشائعة في قسم المساعدة، أو التواصل معنا عبر النموذج وسنرد عليك في أقرب وقت.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <ContactForm />
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            نحن نحترم خصوصيتك. جميع المعلومات التي ترسلها آمنة ومحمية ولن يتم مشاركتها مع أي طرف ثالث.
          </p>
        </div>
      </div>
    </main>
  )
}
