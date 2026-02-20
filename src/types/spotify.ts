// src/types/spotify.ts (opcional, puedes ponerlo dentro del .astro)
export interface SpotifyTrack {
  item: {
    name: string;
    external_urls: { spotify: string };
    album: {
      images: { url: string }[];
    };
    artists: { name: string }[];
  };
  is_playing: boolean;
}

export interface RecentlyPlayed {
  items: {
    track: SpotifyTrack['item'];
    played_at: string;
  }[];
}