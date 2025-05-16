"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const StepsContext = React.createContext<{
  value: number
  onChange: (value: number) => void
} | null>(null)

const Steps = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    onChange?: (value: number) => void
  }
>(({ value = 0, onChange, className, children, ...props }, ref) => {
  const [step, setStep] = React.useState(value)

  // When value changes, update step
  React.useEffect(() => {
    setStep(value)
  }, [value])

  const handleStepChange = React.useCallback(
    (value: number) => {
      setStep(value)
      onChange?.(value)
    },
    [onChange],
  )

  // Count the number of steps
  const stepCount = React.Children.count(children)

  return (
    <StepsContext.Provider value={{ value: step, onChange: handleStepChange }}>
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <nav aria-label="Progress" className="flex">
          <ol role="list" className="space-y-6">
            {React.Children.map(children, (child, index) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<StepProps>, {
                  index,
                  isActive: index === step,
                  isCompleted: index < step,
                  isLastStep: index === stepCount - 1,
                })
              }
              return child
            })}
          </ol>
        </nav>
      </div>
    </StepsContext.Provider>
  )
})

Steps.displayName = "Steps"

interface StepProps extends React.HTMLAttributes<HTMLLIElement> {
  title: string
  description?: string
  index?: number
  isActive?: boolean
  isCompleted?: boolean
  isLastStep?: boolean
}

const Step = React.forwardRef<HTMLLIElement, StepProps>(
  ({ title, description, index, isActive, isCompleted, isLastStep, className, ...props }, ref) => {
    const steps = React.useContext(StepsContext)

    if (!steps) {
      throw new Error("Step must be used within a Steps component")
    }

    const { onChange } = steps

    return (
      <li ref={ref} className={cn("relative flex gap-4", className)} {...props}>
        <div
          className={cn("absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border", {
            "border-[#0A3D62] bg-[#0A3D62] text-white": isCompleted || isActive,
            "border-gray-300 bg-white": !isCompleted && !isActive,
          })}
          onClick={() => index !== undefined && onChange(index)}
        >
          {isCompleted ? (
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-xs">{(index || 0) + 1}</span>
          )}
        </div>
        <div className="flex flex-col pb-8 ml-6">
          <span
            className={cn("text-sm font-medium", {
              "text-[#0A3D62]": isActive || isCompleted,
              "text-gray-500": !isActive && !isCompleted,
            })}
          >
            {title}
          </span>
          {description && <span className="text-xs text-gray-500">{description}</span>}
        </div>
        {!isLastStep && (
          <div
            className={cn("absolute left-0 top-6 h-full w-px bg-gray-300", {
              "bg-[#0A3D62]": isCompleted,
            })}
            aria-hidden="true"
          />
        )}
      </li>
    )
  },
)

Step.displayName = "Step"

export { Steps, Step }
