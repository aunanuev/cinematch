import { Timestamp } from "firebase/firestore";

export interface Movie {
    id: string;             // Firestore Document ID (Auto-generated)
    imdbID: string;         // ID único de OMDb (ej: tt1375666)
    userId: string;         // ID del usuario propietario
    title: string;          // Título de la película
    year: string;           // Año de lanzamiento
    poster_path: string;    // URL de la imagen (Poster)
    overview: string;       // Sinopsis corta (Plot)

    // Campos generados por IA
    aiPitch: string;        // Texto persuasivo generado por Gemini
    vibeTags: string[];     // Array de etiquetas (ej: ["Dark", "Heroic"])
    genres?: string[];      // Géneros de la película (ej: ["Action", "Drama"])
    rating?: number;        // Calificación del usuario (1-5)

    // Estado del usuario
    watched: boolean;       // true = vista, false = pendiente
    createdAt: Timestamp;   // Fecha de creación
}
