"use client"

import { useEffect, useRef, useCallback } from "react"
import { signOut } from "next-auth/react"

const TIMEOUT_MS = 600 * 60 * 1000 // 30 minutes
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"]

export function SessionTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const logout = useCallback(() => {
    signOut({ redirectTo: "/login" })
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(logout, TIMEOUT_MS)
  }, [logout])

  useEffect(() => {
    resetTimer()
    EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      EVENTS.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [resetTimer])

  return null
}
