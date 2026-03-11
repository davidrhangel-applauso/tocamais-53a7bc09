// IDs dos administradores que devem ser ocultados da lista de artistas
export const ADMIN_USER_IDS = [
  "0120d3e5-2c0c-4115-a27f-94dcf5e7ae7d",
  "ae4abf4e-d360-49a5-ad3e-9cb3a710ca26"
];

// Helper to generate artist URL preferring slug
export const getArtistUrl = (artist: { id: string; slug?: string | null }) => {
  return artist.slug ? `/${artist.slug}` : `/artista/${artist.id}`;
};
