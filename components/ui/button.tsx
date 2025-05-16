import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "bg-[#0A3D62] text-white hover:bg-[#0F5585] focus:bg-[#0F5585] active:bg-[#083152]",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 active:bg-red-800",
        outline:
          "border-2 border-[#0A3D62] bg-transparent text-[#0A3D62] hover:bg-[#0A3D62]/10 focus:bg-[#0A3D62]/10 active:bg-[#0A3D62]/20",
        secondary: "bg-[#E5EEF5] text-[#0A3D62] hover:bg-[#D5E3EF] focus:bg-[#D5E3EF] active:bg-[#C5D8E9]",
        ghost: "text-[#0A3D62] hover:bg-[#E5EEF5] focus:bg-[#E5EEF5] active:bg-[#D5E3EF]",
        link: "text-[#0A3D62] underline-offset-4 hover:underline focus:underline",
        success: "bg-green-600 text-white hover:bg-green-700 focus:bg-green-700 active:bg-green-800",
        warning: "bg-amber-500 text-white hover:bg-amber-600 focus:bg-amber-600 active:bg-amber-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
