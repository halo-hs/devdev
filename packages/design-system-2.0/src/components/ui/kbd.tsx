import { cn } from "@ecoya/design-system/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-[var(--r-sm)] bg-[var(--surface-muted-background)] px-1 font-sans text-xs font-medium text-[var(--surface-muted-foreground)] select-none in-data-[slot=tooltip-content]:bg-[var(--surface-background)] in-data-[slot=tooltip-content]:text-[var(--surface-foreground)] [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
