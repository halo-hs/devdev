const svgExtension = ".svg";

function withExtension(fileName: string, extension: string) {
  return fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;
}

// Icons the design system already ships are served from there; the rest
// stay in public/assets/operations/icons. Same files, one copy each.
const designSystemIcons = import.meta.glob<string>(
  "../../../packages/design-system-2.0/src/assets/icons/*.svg",
  { eager: true, query: "?url", import: "default" }
);
const iconAliases: Record<string, string> = {
  "icon-alert-close-blue.svg": "icon-close.svg",
  "icon-alert-close-red.svg": "icon-close.svg",
};

export function ecoyaIcon(fileName: string) {
  const name = withExtension(fileName, svgExtension);
  const shipped = designSystemIcons[`../../../packages/design-system-2.0/src/assets/icons/${iconAliases[name] ?? name}`];
  return shipped ?? `/assets/operations/icons/${name}`;
}

export function ecoyaIllustration(fileName: string) {
  return `/assets/operations/illustrations/${withExtension(fileName, svgExtension)}`;
}

export function ecoyaLandingIcon(fileName: string) {
  return `/assets/operations/icons/landing/${fileName}`;
}

