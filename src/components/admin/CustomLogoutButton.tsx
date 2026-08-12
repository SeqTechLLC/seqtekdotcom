'use client'

import { Button, toast } from '@payloadcms/ui'
import { useState } from 'react'

/**
 * Replaces Payload's built-in logout button (admin.components.logout.Button).
 * The built-in one always shows a success toast regardless of whether logout
 * actually succeeded, and — for this app's custom OAuth-issued sessions —
 * it usually doesn't; see revoke-session-cookie.ts for the full story. This
 * calls our own endpoint and only reports success once the session is
 * actually confirmed revoked.
 */
export default function CustomLogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      if (res.ok) {
        toast.success('You have been logged out.')
      } else {
        toast.error('Logout failed. Please try again.')
      }
    } catch {
      toast.error('Logout failed. Please try again.')
    } finally {
      // Hard navigation regardless of outcome: this clears all client-side
      // React state that thinks the user is still logged in, and Payload's
      // /admin/login view will re-check the (now cleared, if successful)
      // cookie itself on load.
      window.location.href = '/admin/login'
    }
  }

  return (
    <Button buttonStyle="tab" disabled={loading} onClick={handleLogout} type="button">
      Log out
    </Button>
  )
}
