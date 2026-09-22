"use client";

import type { HTMLAttributes, ReactNode } from "react";

import { Loader } from "./etc";
import { Icon } from "./icon";
import { cx } from "./utils";

export type ImageProps = HTMLAttributes<HTMLDivElement> & {
  imageHeight?: number;
  imagePlaceholder?: ReactNode;
  imageSrc?: string;
  imageWidth?: number;
  isLoading?: boolean;
  loadingSlot?: ReactNode;
  topRightAccessory?: ReactNode;
};

export function Image({
  className,
  imageHeight = 100,
  imagePlaceholder,
  imageSrc,
  imageWidth = 100,
  isLoading = false,
  loadingSlot,
  style,
  topRightAccessory,
  ...props
}: ImageProps) {
  const hasImage = Boolean(imageSrc);
  const shouldCenterContent = isLoading || !hasImage;

  return (
    <div
      className={cx(
        "relative cursor-pointer overflow-hidden rounded-[8px] border border-ecoya-gray-10",
        hasImage ? "bg-cover bg-center bg-no-repeat" : "bg-ecoya-gray-11",
        shouldCenterContent && "flex items-center justify-center",
        className,
      )}
      data-ui="image"
      role="img"
      style={{
        ...style,
        backgroundImage: hasImage ? `url("${imageSrc}")` : style?.backgroundImage,
        height: imageHeight,
        width: imageWidth,
      }}
      {...props}
    >
      {isLoading ? (loadingSlot ?? <Loader />) : null}
      {!isLoading && !hasImage ? (
        imagePlaceholder ?? <Icon className="size-[30px] text-ecoya-gray-7" name="icon-image" />
      ) : null}
      {!isLoading && hasImage && topRightAccessory ? (
        <div className="absolute right-0.5 top-0.5">{topRightAccessory}</div>
      ) : null}
      {!isLoading && hasImage ? (
        <div className="absolute inset-0 bg-transparent transition-colors hover:bg-[rgba(0,0,0,0.7)]" />
      ) : null}
    </div>
  );
}
