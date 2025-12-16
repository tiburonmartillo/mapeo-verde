export const getRandomUnsplashImage = (seed: string, width: number = 1000, height: number = 1000): string => {
  // Use seed to generate consistent but varied image IDs
  const seedNum = seed.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const imageId = (seedNum % 1000) + 1; // Random ID between 1-1000
  // Picsum Photos provides random images with seed for consistency
  return `https://picsum.photos/seed/${seed}${imageId}/${width}/${height}`;
};
