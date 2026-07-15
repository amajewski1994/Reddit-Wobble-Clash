const CHARACTER_IMAGE_EXTENSIONS: Record<string, string> = {
  avatar_001_image: 'jpg',
  avatar_002_image: 'jpg',
  avatar_003_image: 'png',
  avatar_004_image: 'jpg',
  avatar_005_image: 'png',
  avatar_006_image: 'png',
  avatar_007_image: 'png',
  avatar_008_image: 'png',
  avatar_009_image: 'png',
  avatar_010_image: 'jpg',
  avatar_011_image: 'png',
  avatar_012_image: 'png',
  avatar_013_image: 'png',
  avatar_014_image: 'png',
  avatar_015_image: 'png',
};

export const getCharacterImageUrl = (image: string) =>
  `/assets/characters_images/${image}.${CHARACTER_IMAGE_EXTENSIONS[image] ?? 'png'}`;
