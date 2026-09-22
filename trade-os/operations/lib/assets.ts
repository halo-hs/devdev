const svgExtension = ".svg";

function withExtension(fileName: string, extension: string) {
  return fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;
}

export function ecoyaIcon(fileName: string) {
  return `/assets/operations/icons/${withExtension(fileName, svgExtension)}`;
}

export function ecoyaIllustration(fileName: string) {
  return `/assets/operations/illustrations/${withExtension(fileName, svgExtension)}`;
}

export function ecoyaLandingIcon(fileName: string) {
  return `/assets/operations/icons/landing/${fileName}`;
}

