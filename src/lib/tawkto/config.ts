/**
 * Tawk.to Chat Widget Configuration
 * Centralized configuration for the live chat widget
 */

export const tawktoConfig = {
  propertyId: process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID || '',
  widgetId: process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID || '',

  // Widget customization
  customization: {
    // RTL positioning for Arabic
    position: 'bl', // bottom-left for RTL

    // Brand colors matching TafawqoqWeb theme
    primaryColor: '#1E5631', // primary green from tailwind.config.ts
    accentColor: '#D4AF37', // accent gold from tailwind.config.ts

    // Arabic language
    locale: 'ar',
  },

  // Feature flags
  features: {
    hideForAdmins: true, // Hide widget for admin users
    lazyLoad: true, // Load widget after page load for performance
    passUserContext: true, // Pass authenticated user info
  },
} as const

export function isConfigured(): boolean {
  return !!(tawktoConfig.propertyId && tawktoConfig.widgetId)
}
