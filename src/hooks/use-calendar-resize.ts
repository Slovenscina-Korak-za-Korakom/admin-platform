import { useEffect, useRef } from "react"
import type FullCalendar from "@fullcalendar/react"

/**
 * Observes a container element for size changes (e.g. sidebar collapse, window
 * resize) and tells FullCalendar to recalculate its layout accordingly.
 */
export function useCalendarResize(calendarRef: React.RefObject<FullCalendar | null>) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(() => {
      calendarRef.current?.getApi().updateSize()
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [calendarRef])

  return containerRef
}