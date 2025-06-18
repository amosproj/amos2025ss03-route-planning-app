"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressAnimationProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number
}

export function ProgressAnimation({
  className,
  value,
  ...props
}: ProgressAnimationProps) {
  const [progress, setProgress] = React.useState<number | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(value ?? 66), 500)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="w-full overflow-hidden rounded-t-lg">
      <style>
        {`@keyframes progress {
            to {
              left: calc(100% - 2rem);
            }
          }
          .progress {
            transform-origin: center;
            animation: progress 1.25s ease-in-out infinite;
          }
        `}
      </style>

      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(
          "bg-primary/20 relative h-2 w-full",
          className
        )}
        {...props}
      >
        {progress !== null && (
          <ProgressPrimitive.Indicator
            data-slot="progress-indicator"
            className="bg-primary h-full w-full flex-1 transition-all"
            style={{ transform: `translateX(-${100 - progress}%)` }}
          >
            <div className="absolute left-0 w-8 h-full bg-primary-foreground blur-[10px] inset-y-0 progress" />
          </ProgressPrimitive.Indicator>
        )}
      </ProgressPrimitive.Root>
    </div>
  )
}
