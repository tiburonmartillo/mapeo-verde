// Helper function to generate random Unsplash images using Picsum Photos
export const getRandomUnsplashImage = (seed: string, width = 1000, height = 1000): string => {
  // Use seed to generate consistent but varied image IDs
  const seedNum = seed.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageId = (seedNum % 1000) + 1; // Random ID between 1-1000
  // Picsum Photos provides random images with seed for consistency
  return `https://picsum.photos/seed/${seed}${imageId}/${width}/${height}`;
};

// Placeholder images using random Unsplash
export const MOCK_IMAGES = {
  sanMarcos: getRandomUnsplashImage('sanmarcos', 1000, 1000),
  tresCenturias: getRandomUnsplashImage('trescenturias', 1000, 1000),
  rodolfoLanderos: getRandomUnsplashImage('rodolfolanderos', 1000, 1000),
  lineaVerde: getRandomUnsplashImage('lineaverde', 1000, 1000)
};

