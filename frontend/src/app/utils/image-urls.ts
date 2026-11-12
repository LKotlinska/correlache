// Relative to <base href> so the app still finds the images when served under a sub-path.
const IMAGES = 'images';

/** URL of an exercise's still image, or null when it has none. */
export function exerciseStillUrl(imageName: string | null): string | null {
  return imageName ? `${IMAGES}/exercises/stills/${imageName}` : null;
}

/** URL of an exercise's animation, or null when it has none. */
export function exerciseAnimationUrl(gifName: string | null): string | null {
  return gifName ? `${IMAGES}/exercises/${gifName}` : null;
}

/** URL of a headache location's picture, or null when it has none. */
export function headacheLocationUrl(image: string | null): string | null {
  return image ? `${IMAGES}/headache_location/${image}` : null;
}
