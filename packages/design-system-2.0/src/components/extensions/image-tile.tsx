import * as React from "react"
import { ImageIcon } from "lucide-react"

import { Skeleton } from "@ecoya/design-system/ui/skeleton"
import { cn } from "@ecoya/design-system/lib/utils"

type ImageElementProps = Omit<
  React.ComponentPropsWithoutRef<"img">,
  "alt" | "src"
>

export interface ImageTileProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  imageSrc?: string
  /** Alternative text for the image, or an empty string for a decorative image. */
  alt: string
  imagePlaceholder?: React.ReactNode
  /** Short alias for `imagePlaceholder`. */
  placeholder?: React.ReactNode
  isLoading?: boolean
  /** Short alias for `isLoading`. */
  loading?: boolean
  loadingLabel?: string
  topRightAccessory?: React.ReactNode
  imageWidth?: number | string
  imageHeight?: number | string
  dimOnHover?: boolean
  imageProps?: ImageElementProps
}

function toCssSize(value: number | string) {
  return typeof value === "number" ? `${value}px` : value
}

function ImageTile({
  imageSrc,
  alt,
  imagePlaceholder,
  placeholder,
  isLoading,
  loading,
  loadingLabel = "Loading image",
  topRightAccessory,
  imageWidth = 100,
  imageHeight = 100,
  dimOnHover = true,
  imageProps,
  className,
  style,
  ...divProps
}: ImageTileProps) {
  const loadingState = loading ?? isLoading ?? false
  const resolvedPlaceholder = placeholder ?? imagePlaceholder

  return (
    <div
      data-slot="image-tile"
      data-state={loadingState ? "loading" : imageSrc ? "loaded" : "empty"}
      aria-busy={loadingState || undefined}
      className={cn(
        "group relative overflow-hidden rounded-[var(--r-md)] border bg-muted",
        className
      )}
      style={{
        width: toCssSize(imageWidth),
        height: toCssSize(imageHeight),
        ...style,
      }}
      {...divProps}
    >
      {loadingState ? (
        <Skeleton
          role="status"
          aria-label={loadingLabel}
          className="size-full rounded-none"
        />
      ) : imageSrc ? (
        // A raw img keeps this source-level design-system primitive portable;
        // application shells may compose their framework image optimizer above it.
        <img
          {...imageProps}
          src={imageSrc}
          alt={alt}
          className={cn("size-full object-cover", imageProps?.className)}
        />
      ) : (
        <div
          data-slot="image-tile-placeholder"
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          className="flex size-full items-center justify-center text-muted-foreground [&_svg]:size-7"
        >
          {resolvedPlaceholder ?? <ImageIcon aria-hidden="true" />}
        </div>
      )}

      {!loadingState && imageSrc && dimOnHover && (
        <span
          data-slot="image-tile-dim"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-transparent transition-colors group-focus-within:bg-[var(--image-tile-overlay-hover)] group-hover:bg-[var(--image-tile-overlay-hover)]"
        />
      )}

      {!loadingState && imageSrc && topRightAccessory && (
        <div
          data-slot="image-tile-accessory"
          className="absolute top-1 right-1"
        >
          {topRightAccessory}
        </div>
      )}
    </div>
  )
}

export { ImageTile }
