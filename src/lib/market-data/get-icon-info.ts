/**
 * Determine the icon image path and background color for a token
 * @param tokenName The token symbol/name
 * @returns Icon information object
 */
export function getIconInfo(tokenName: string) {
  const raw = (tokenName || '').toString().trim();
  const u = raw.toUpperCase();

  // Always attempt to use an image. If it doesn't exist, UI should fallback visually.
  return {
    hasImage: true,
    imagePath: `/tokens/${u}.png`,
    bg: '#000000',
  };
}