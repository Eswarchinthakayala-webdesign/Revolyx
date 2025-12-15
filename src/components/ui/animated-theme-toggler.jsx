import { useCallback, useRef, useState } from "react" // <-- Added useState
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"
import { useTheme } from "../theme-provider"


export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}) => {
  const { theme, setTheme } = useTheme()
  const buttonRef = useRef(null)
  // State to control the rotation animation
  const [isRotating, setIsRotating] = useState(false)

  const isDark = theme === "dark"

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    // 1. Start rotation immediately
    setIsRotating(true)

    // Use View Transitions API
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(isDark ? "light" : "dark")
      })
    })
    
    // Wait for the DOM update to be ready
    await transition.ready

    // Button center
    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2

    // Full-screen radius
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    // Circular reveal animation
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )

    // 2. Stop rotation after the animation time (ensures the rotation is visible during the transition)
    setTimeout(() => {
        setIsRotating(false)
    }, duration)

  }, [isDark, setTheme, duration])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center",
        className
      )}
      {...props}
    >
      {/* New wrapper div to apply the rotation transition */}
      <div className={cn(
        "transition-transform duration-500 ease-in-out", // Apply rotation styles here
        isRotating ? "rotate-[360deg]" : "rotate-0"
      )}>
        {isDark ? (
          // Icons are now simple, their animation is handled by the wrapper
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}