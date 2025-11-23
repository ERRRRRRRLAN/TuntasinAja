'use client'

import { useEffect } from 'react'

export default function PWAManifest() {
  useEffect(() => {
    // Add manifest link dynamically to ensure it's in the DOM
    const addManifestLink = () => {
      // Remove existing manifest links to avoid duplicates
      const existingLinks = document.querySelectorAll('link[rel="manifest"]')
      existingLinks.forEach(link => link.remove())

      // Add manifest link
      const manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      manifestLink.href = '/manifest.json'
      manifestLink.type = 'application/manifest+json'
      document.head.appendChild(manifestLink)

      // Also add as fallback to API route
      const apiManifestLink = document.createElement('link')
      apiManifestLink.rel = 'manifest'
      apiManifestLink.href = '/api/manifest.json'
      apiManifestLink.type = 'application/manifest+json'
      document.head.appendChild(apiManifestLink)
    }

    // Add immediately if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addManifestLink)
    } else {
      addManifestLink()
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', addManifestLink)
    }
  }, [])

  return null
}

