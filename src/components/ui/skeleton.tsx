import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-[var(--r-sm)] bg-[var(--color-gray-10)]",
        "rounded-[var(--r-xs)]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
