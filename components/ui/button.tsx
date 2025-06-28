import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 hover:text-white font-medium",
      destructive: "bg-red-600 text-white border border-red-700 hover:bg-red-700 hover:text-white font-medium",
      outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900 font-medium",
      secondary: "bg-gray-600 text-white border border-gray-700 hover:bg-gray-700 hover:text-white font-medium",
      ghost: "text-gray-900 hover:bg-gray-100 hover:text-gray-900 font-medium",
      link: "text-blue-600 underline-offset-4 hover:underline font-medium"
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3 text-sm",
      lg: "h-11 rounded-md px-8 text-base",
      icon: "h-10 w-10"
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 arabic-text-bold",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
