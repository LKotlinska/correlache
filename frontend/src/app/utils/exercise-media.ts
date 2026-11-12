// Relative to <base href> so the app still finds the images when served under a sub-path.
const EXERCISE_IMAGES = 'images/exercises';

/** URL of an exercise's still image, or null when it has none. */
export function exerciseStillUrl(imageName: string | null): string | null {
  return imageName ? `${EXERCISE_IMAGES}/stills/${imageName}` : null;
}

/** URL of an exercise's animation, or null when it has none. */
export function exerciseAnimationUrl(gifName: string | null): string | null {
  return gifName ? `${EXERCISE_IMAGES}/${gifName}` : null;
}
