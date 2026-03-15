import {
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    query,
    where,
    onSnapshot,
    orderBy,
    Timestamp
} from "firebase/firestore";
import { db } from "./config";
import { Movie, Series } from "@/types";

const COLLECTION_NAME = "movies";
const SERIES_COLLECTION_NAME = "series";

export const addMovie = async (movieData: Omit<Movie, "id">) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), movieData);
        return docRef.id;
    } catch (error) {
        console.error("Error adding movie: ", error);
        throw error;
    }
};

export const deleteMovie = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting movie: ", error);
        throw error;
    }
};

export const toggleMovieWatched = async (id: string, currentStatus: boolean) => {
    try {
        await updateDoc(doc(db, COLLECTION_NAME, id), {
            watched: !currentStatus
        });
    } catch (error) {
        console.error("Error updating movie status: ", error);
        throw error;
    }
};

export const updateMovieRating = async (id: string, rating: number) => {
    try {
        await updateDoc(doc(db, COLLECTION_NAME, id), {
            rating: rating
        });
    } catch (error) {
        console.error("Error updating movie rating: ", error);
        throw error;
    }
};

export const updateMovie = async (id: string, fields: Partial<Pick<Movie, "title" | "year" | "overview" | "aiPitch" | "vibeTags">>) => {
    try {
        await updateDoc(doc(db, COLLECTION_NAME, id), fields);
    } catch (error) {
        console.error("Error updating movie: ", error);
        throw error;
    }
};

export const subscribeToMovies = (userId: string, callback: (movies: Movie[]) => void) => {
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 2000;
    let cancelled = false;

    const subscribe = () => {
        if (cancelled) return;
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
            retryDelay = 2000; // reset on success
            const movies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Movie[];
            callback(movies);
        }, (error) => {
            console.error("Error fetching movies, retrying...", error);
            if (cancelled) return;
            retryTimeout = setTimeout(() => {
                retryDelay = Math.min(retryDelay * 2, 30000);
                subscribe();
            }, retryDelay);
        });
    };

    subscribe();

    return () => {
        cancelled = true;
        if (retryTimeout) clearTimeout(retryTimeout);
        if (unsubscribe) unsubscribe();
    };
};

// --- Series Functions ---

export const addSeries = async (seriesData: Omit<Series, "id">) => {
    try {
        const docRef = await addDoc(collection(db, SERIES_COLLECTION_NAME), seriesData);
        return docRef.id;
    } catch (error) {
        console.error("Error adding series: ", error);
        throw error;
    }
};

export const deleteSeries = async (id: string) => {
    try {
        await deleteDoc(doc(db, SERIES_COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting series: ", error);
        throw error;
    }
};

export const toggleSeriesWatched = async (id: string, currentStatus: boolean) => {
    try {
        await updateDoc(doc(db, SERIES_COLLECTION_NAME, id), {
            watched: !currentStatus
        });
    } catch (error) {
        console.error("Error updating series status: ", error);
        throw error;
    }
};

export const updateSeriesRating = async (id: string, rating: number) => {
    try {
        await updateDoc(doc(db, SERIES_COLLECTION_NAME, id), {
            rating: rating
        });
    } catch (error) {
        console.error("Error updating series rating: ", error);
        throw error;
    }
};

export const updateSeries = async (id: string, fields: Partial<Pick<Series, "title" | "year" | "overview" | "aiPitch" | "vibeTags">>) => {
    try {
        await updateDoc(doc(db, SERIES_COLLECTION_NAME, id), fields);
    } catch (error) {
        console.error("Error updating series: ", error);
        throw error;
    }
};

export const subscribeToSeries = (userId: string, callback: (series: Series[]) => void) => {
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 2000;
    let cancelled = false;

    const subscribe = () => {
        if (cancelled) return;
        const q = query(
            collection(db, SERIES_COLLECTION_NAME),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
            retryDelay = 2000; // reset on success
            const seriesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Series[];
            callback(seriesList);
        }, (error) => {
            console.error("Error fetching series, retrying...", error);
            if (cancelled) return;
            retryTimeout = setTimeout(() => {
                retryDelay = Math.min(retryDelay * 2, 30000);
                subscribe();
            }, retryDelay);
        });
    };

    subscribe();

    return () => {
        cancelled = true;
        if (retryTimeout) clearTimeout(retryTimeout);
        if (unsubscribe) unsubscribe();
    };
};
