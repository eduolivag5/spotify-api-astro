// src/lib/spotify.ts
import type { RecentlyPlayed, SpotifyAlbum, SpotifyArtist, SpotifyTrack } from '../types/spotify';

const client_id = import.meta.env.SPOTIFY_CLIENT_ID;
const client_secret = import.meta.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = import.meta.env.SPOTIFY_REFRESH_TOKEN;

const BASIC_AUTH = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const API_BASE = 'https://api.spotify.com/v1';

let cachedToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

/**
 * Obtiene el Access Token manejando ráfagas de peticiones simultáneas
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  if (tokenPromise) return tokenPromise;

  tokenPromise = (async () => {
    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${BASIC_AUTH}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token as string,
        }),
      });

      const data = await response.json();
      cachedToken = data.access_token;

      // Limpiar caché 5 minutos antes de que expire (Spotify suele dar 1h)
      setTimeout(() => {
        cachedToken = null;
        tokenPromise = null;
      }, 3300 * 1000);

      return data.access_token;
    } catch (error) {
      tokenPromise = null;
      throw error;
    }
  })();

  return tokenPromise;
}

/**
 * Wrapper genérico con manejo de Rate Limit (429)
 */
async function spotifyFetch<T>(endpoint: string): Promise<T | null> {
  const token = await getAccessToken();

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.warn(`\x1b[31m[RATE LIMIT]\x1b[0m Reintentar en ${retryAfter}s: ${endpoint}`);
      return null;
    }

    if (response.status === 204) return null;

    if (!response.ok) {
      const textError = await response.text();
      console.error(`\x1b[31m[Spotify Error]\x1b[0m ${endpoint} -> ${response.status}: ${textError}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`\x1b[31mSpotify API Error [${endpoint}]:\x1b[0m`, error);
    return null;
  }
}

// --- Funciones de Artista ---

export const getRecentlyPlayed = async (limit = 10) => {
  const data = await spotifyFetch<RecentlyPlayed>(`/me/player/recently-played?limit=${limit}`);
  return data?.items ?? [];
};

export const getTopArtists = async (limit = 10) => {
  const data = await spotifyFetch<{ items: SpotifyArtist[] }>(
    `/me/top/artists?limit=${limit}&time_range=short_term`
  );
  return data?.items ?? [];
};

export const getArtist = async (id: string) => {
  return await spotifyFetch<SpotifyArtist>(`/artists/${id}`);
};

/**
 * Función consolidada para reducir llamadas en la página de artista
 */
export const getArtistData = async (id: string) => {
  // Solo 2 llamadas en lugar de 3 o 4
  const [artist, allAlbumsData] = await Promise.all([
    getArtist(id),
    spotifyFetch<{ items: (SpotifyAlbum & { album_type?: string })[] }>(
      `/artists/${id}/albums?include_groups=album,single&market=ES&limit=10`
    )
  ]);

  const allItems = allAlbumsData?.items ?? [];

  console.log(allItems)

  return {
    artist,
    albums: allItems.filter(item => item.album_type === 'album'),
    singles: allItems.filter(item => item.album_type === 'single')
  };
};

export const getArtistTopTracks = async (id: string) => {
  const data = await spotifyFetch<{ tracks: SpotifyTrack['item'][] }>(
    `/artists/${id}/top-tracks?market=ES`
  );
  return data?.tracks ?? [];
};

export const getArtistAlbums = async (id: string) => {
  const data = await spotifyFetch<{ items: SpotifyAlbum[] }>(
    `/artists/${id}/albums?include_groups=album,single&limit=20&market=ES`
  );
  return data?.items ?? [];
};

export const getAlbum = async (id: string) => {
  return await spotifyFetch<SpotifyAlbum>(`/albums/${id}?market=ES`);
};

export const getAlbumTracks = async (id: string) => {
  const data = await spotifyFetch<{ items: SpotifyTrack['item'][] }>(
    `/albums/${id}/tracks?limit=50&market=ES`
  );
  return data?.items ?? [];
};

export const getRelatedArtists = async (id: string) => {
  const data = await spotifyFetch<{ artists: SpotifyArtist[] }>(
    `/artists/${id}/related-artists`
  );
  return data?.artists ?? [];
};

export const getAudioFeatures = async (ids: string) => {
  if (!ids) return [];
  const data = await spotifyFetch<{ audio_features: any[] }>(
    `/audio-features?ids=${ids}`
  );
  return data?.audio_features ?? [];
};

export const getArtistAppearsOn = async (id: string) => {
  const data = await spotifyFetch<{ items: SpotifyAlbum[] }>(
    `/artists/${id}/albums?include_groups=appears_on&limit=20&market=ES`
  );
  return data?.items ?? [];
};

interface SavedAlbumsResponse {
  items: {
    added_at: string;
    album: SpotifyAlbum; 
  }[];
}

export const getUserSavedAlbums = async (limit = 10, offset = 0) => {
  const data = await spotifyFetch<SavedAlbumsResponse>(
    `/me/albums?limit=${limit}&offset=${offset}&market=ES`
  );
  
  // Retorna el array de items que contiene { added_at, album }
  return data?.items ?? [];
};