import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'outline'
}>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    success: "bg-green-500/15 text-green-600 border-green-500/30",
    danger: "bg-red-500/15 text-red-600 border-red-500/30",
    warning: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    outline: "border border-input",
  }
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
