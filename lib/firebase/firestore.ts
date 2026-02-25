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
import { Movie } from "@/types";

const COLLECTION_NAME = "movies";

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
    const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const movies = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Movie[];
        callback(movies);
    }, (error) => {
        console.error("Error fetching movies:", error);
    });
};
