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

// src/types/spotify.ts

// 1. Definición atómica del objeto
export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string; height?: number; width?: number }[];
  external_urls: { spotify: string };
  owner: { display_name: string };
  tracks: { total: number };
  type: string;
}

// 2. Interfaz Genérica de Paginación (La "navaja suiza")
export interface SpotifyPaging<T> {
  href: string;
  items: T[]; // T será SpotifyPlaylist, SpotifyTrack, etc.
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}