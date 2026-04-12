import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3.5 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-b dark:bg-primary text-primary-foreground from-foreground/70 to-foreground/90 [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive/60 text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-green-500 text-white [a&]:hover:bg-green-500/90 focus-visible:ring-green-500/20 dark:focus-visible:ring-green-500/40 dark:bg-green-500/60",
        paid: "border-transparent bg-blue-500 text-white [a&]:hover:bg-blue-500/90 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-500/40 dark:bg-blue-500/60",
        booked: "border-transparent bg-emerald-500 text-white [a&]:hover:bg-emerald-500/90 focus-visible:ring-emerald-500/20 dark:focus-visible:ring-emerald-500/40 dark:bg-emerald-500/60",
        cancelled: "border-transparent bg-red-500 text-white [a&]:hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-500/60",
        completed: "border-transparent bg-[var(--event-bg-completed)] text-white [a&]:hover:bg-[var(--event-bg-completed)]/90 focus-visible:ring-[var(--event-bg-completed)]/20 dark:focus-visible:ring-[var(--event-bg-completed)]/40 dark:bg-[var(--event-bg-completed)]/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
                 className,
                 variant = "default",
                 asChild = false,
                 ...props
               }: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
