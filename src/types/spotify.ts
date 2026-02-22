// src/types/spotify.ts

export interface SpotifyTrack {
  item: {
    id: string;
    name: string;
    external_urls: { spotify: string };
    album: {
      id: string; // Añadido id para navegación
      name: string;
      images: { url: string }[];
      release_date: string;
    };
    artists: { 
      id: string;
      name: string;
      external_urls: { spotify: string };
    }[];
    duration_ms: number;
    explicit: boolean;
    preview_url: string | null;
  };
  is_playing: boolean;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: { spotify: string };
  images: { url: string; height?: number; width?: number; }[];
  genres?: string[];
  followers?: { total: number };
  popularity?: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: 'album' | 'single' | 'compilation';
  release_date: string;
  total_tracks: number;
  external_urls: { spotify: string };
  images: { url: string }[];
  artists: SpotifyArtist[];
  tracks?: {
    items: SpotifyTrack['item'][];
  };
}

export interface RecentlyPlayed {
  items: {
    track: SpotifyTrack['item'];
    played_at: string;
  }[];
}