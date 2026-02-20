import type { RecentlyPlayed, SpotifyAlbum, SpotifyArtist, SpotifyTrack } from '../types/spotify';

const client_id = import.meta.env.SPOTIFY_CLIENT_ID;
const client_secret = import.meta.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = import.meta.env.SPOTIFY_REFRESH_TOKEN;

const BASIC_AUTH = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const API_BASE = 'https://api.spotify.com/v1';

// Caché del token en memoria para evitar múltiples peticiones por renderizado
let cachedToken: string | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken) return cachedToken;

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
  return data.access_token;
}

/**
 * Wrapper genérico para peticiones a la API de Spotify
 */
async function spotifyFetch<T>(endpoint: string): Promise<T | null> {
  const token = await getAccessToken();
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 204) return null;
    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error(`Spotify API Error [${endpoint}]:`, error);
    return null;
  }
}

export const getRecentlyPlayed = async (limit = 10) => {
  const data = await spotifyFetch<RecentlyPlayed>(`/me/player/recently-played?limit=${limit}`);
  return data?.items ?? [];
};

export const getTopArtists = async (limit = 6) => {
  const data = await spotifyFetch<{ items: SpotifyArtist[] }>(
    `/me/top/artists?limit=${limit}&time_range=short_term`
  );
  return data?.items ?? [];
};

export const getArtist = async (id: string) => {
  return await spotifyFetch<SpotifyArtist>(`/artists/${id}`);
};

export const getArtistTopTracks = async (id: string) => {
  const data = await spotifyFetch<{ tracks: SpotifyTrack['item'][] }>(
    `/artists/${id}/top-tracks?market=ES`
  );
  return data?.tracks ?? [];
};

export const getArtistAlbums = async (id: string) => {
  const data = await spotifyFetch<{ items: SpotifyAlbum[] }>(
    `/artists/${id}/albums?include_groups=album,single&limit=10&market=ES`
  );
  return data?.items ?? [];
};

// --- Nuevas Funciones para Albums ---

export const getAlbum = async (id: string) => {
  return await spotifyFetch<SpotifyAlbum>(`/albums/${id}?market=ES`);
};

export const getAlbumTracks = async (id: string) => {
  const data = await spotifyFetch<{ items: SpotifyTrack['item'][] }>(
    `/albums/${id}/tracks?limit=50&market=ES`
  );
  return data?.items ?? [];
};