import { Timestamp } from "firebase/firestore";

export interface MediaItem {
    id: string;             // Firestore Document ID (Auto-generated)
    imdbID: string;         // ID único (ej: tt1375666 o TMDB ID)
    userId: string;         // ID del usuario propietario
    title: string;          // Título
    year: string;           // Año de lanzamiento o años de emisión
    poster_path: string;    // URL de la imagen (Poster)
    overview: string;       // Sinopsis corta (Plot)

    // Campos generados por IA
    aiPitch: string;        // Texto persuasivo generado por Gemini
    vibeTags: string[];     // Array de etiquetas (ej: ["Dark", "Heroic"])
    genres?: string[];      // Géneros (ej: ["Action", "Drama"])
    rating?: number;        // Calificación del usuario (1-5)

    // Estado del usuario
    watched: boolean;       // true = vista, false = pendiente
    createdAt: Timestamp;   // Fecha de creación
}

export interface Movie extends MediaItem {}

export interface Series extends MediaItem {
    // Campos específicos para series (opcional para el futuro)
    // ej: totalSeasons?: number;
}

// ─── Watch Providers (TMDB) ───────────────────────────────────────────────────

export interface WatchProvider {
    provider_id: number;
    provider_name: string;
    logo_path: string;   // relative path, prefix with https://image.tmdb.org/t/p/w45
    display_priority?: number;
}

export interface WatchProvidersData {
    flatrate: WatchProvider[] | null;
    rent: WatchProvider[] | null;
    buy: WatchProvider[] | null;
    link: string | null;  // JustWatch affiliate link
}
