import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Typography utilities such as text-body-14 or text-header-26 are font sizes;
// without this tailwind-merge files them as text colors and drops them.
const isTypographySize = (value: string) =>
  /^(?:header|display|body|button|label|badge)-\d+$/.test(value)

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [isTypographySize] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
