import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type PresetColors = "primary" | "secondary" | "accent" | "success" | "destructive"

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  color?: PresetColors | string
}

function isColorCode(color: string) {
  return color.startsWith("#") || color.startsWith("rgb")
}

export function Checkbox({ className, color = "primary", ...props }: CheckboxProps) {
  const presetColorClassMap: Record<PresetColors, string> = {
    primary: "data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary-foreground",
    secondary: "data-[state=checked]:bg-secondary data-[state=checked]:border-secondary text-secondary-foreground",
    accent: "data-[state=checked]:bg-accent data-[state=checked]:border-accent text-accent-foreground",
    success: "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 text-white",
    destructive: "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 text-white",
  }

  const isCustomColorCode = typeof color === "string" && isColorCode(color)

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        !isCustomColorCode && presetColorClassMap[color as PresetColors],
        className
      )}
      style={
        isCustomColorCode
          ? {
            backgroundColor: props.checked ? color : undefined,
            borderColor: props.checked ? color : undefined,
            color: props.checked ? "white" : undefined,
          }
          : undefined
      }
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
