import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className, value = 0, ...props }, ref) => (
  <div
    ref={ref}
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={100}
    role="progressbar"
    className={cn("relative h-2 w-full rounded-full bg-gray-200", className)}
    {...props}
  >
    <span
      className="absolute left-0 top-0 h-full rounded-full bg-[#0A3D62] transition-all"
      style={{ width: `${value}%` }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }
