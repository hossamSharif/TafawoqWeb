'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { tawktoConfig, isConfigured } from '@/lib/tawkto/config'

declare global {
  interface Window {
    Tawk_API?: any
    Tawk_LoadStart?: Date
  }
}

export function TawkToWidget() {
  const { user, profile, subscription, isLoading } = useAuth()

  useEffect(() => {
    // Don't load if not configured
    if (!isConfigured()) {
      console.warn(
        '[TawkTo] Widget not configured. Add NEXT_PUBLIC_TAWKTO_PROPERTY_ID and NEXT_PUBLIC_TAWKTO_WIDGET_ID to environment variables.'
      )
      return
    }

    // Don't load for admin users
    if (tawktoConfig.features.hideForAdmins && profile?.is_admin) {
      console.log('[TawkTo] Widget hidden for admin users')
      return
    }

    // Initialize Tawk.to API object
    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    // Configure widget before script loads
    window.Tawk_API.customStyle = {
      visibility: {
        desktop: {
          position: tawktoConfig.customization.position,
          xOffset: 20,
          yOffset: 20,
        },
        mobile: {
          position: tawktoConfig.customization.position,
          xOffset: 10,
          yOffset: 10,
        },
      },
    }

    // Set user attributes when authenticated
    if (!isLoading && user && profile) {
      window.Tawk_API.onLoad = function () {
        console.log('[TawkTo] Widget loaded, setting user attributes')

        // Set visitor name and email
        window.Tawk_API.setAttributes(
          {
            name: profile.display_name || 'مستخدم',
            email: user.email || '',
            hash: user.id, // Unique identifier
          },
          function (error: any) {
            if (error) {
              console.error('[TawkTo] Error setting attributes:', error)
            }
          }
        )

        // Add custom visitor information
        window.Tawk_API.addTags([
          subscription?.tier === 'premium' ? 'premium' : 'free',
          profile.academic_track || 'unknown_track',
        ])

        // Add custom data
        window.Tawk_API.addEvent('user-context', {
          user_id: user.id,
          subscription_tier: subscription?.tier || 'free',
          subscription_status: subscription?.status || 'none',
          academic_track: profile.academic_track || 'not_set',
          is_admin: profile.is_admin || false,
          registration_date: profile.created_at,
        })
      }
    } else {
      // Guest user - no authentication
      window.Tawk_API.onLoad = function () {
        console.log('[TawkTo] Widget loaded for guest user')
        window.Tawk_API.addTags(['guest'])
      }
    }

    // Load Tawk.to script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://embed.tawk.to/${tawktoConfig.propertyId}/${tawktoConfig.widgetId}`
    script.charset = 'UTF-8'
    script.setAttribute('crossorigin', '*')

    // For lazy loading, delay script insertion
    if (tawktoConfig.features.lazyLoad) {
      // Load after 3 seconds or on user interaction
      const loadTimer = setTimeout(() => {
        document.body.appendChild(script)
      }, 3000)

      const loadOnInteraction = () => {
        clearTimeout(loadTimer)
        document.body.appendChild(script)
        document.removeEventListener('mousemove', loadOnInteraction)
        document.removeEventListener('scroll', loadOnInteraction)
        document.removeEventListener('touchstart', loadOnInteraction)
      }

      document.addEventListener('mousemove', loadOnInteraction)
      document.addEventListener('scroll', loadOnInteraction)
      document.addEventListener('touchstart', loadOnInteraction)

      return () => {
        clearTimeout(loadTimer)
        document.removeEventListener('mousemove', loadOnInteraction)
        document.removeEventListener('scroll', loadOnInteraction)
        document.removeEventListener('touchstart', loadOnInteraction)
      }
    } else {
      // Load immediately
      document.body.appendChild(script)
    }

    // Cleanup
    return () => {
      // Remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [user, profile, subscription, isLoading])

  // This component renders nothing - script is added to document body
  return null
}
