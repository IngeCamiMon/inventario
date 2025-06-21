// database.js
// Importa la instancia de Firestore desde config.js
import { db, getFirestoreCollectionPath } from './config.js';

// Importa las funciones necesarias de Firestore
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

/**
 * Clase que gestiona las operaciones CRUD en la base de datos Firestore.
 */
class DatabaseService {
    /**
     * Guarda o actualiza un producto en Firestore.
     * @param {Object} product - Datos del producto.
     * @param {string} userId - ID del usuario que crea/actualiza el producto.
     * @returns {Promise<string>} - ID del producto guardado o actualizado.
     */
    async saveProduct(product, userId) {
        try {
            const collectionName = getFirestoreCollectionPath();
            if (!product || typeof product !== 'object') throw new Error("Datos inválidos");
            if (!userId) throw new Error("ID de usuario no proporcionado");
            const timestamp = new Date();
            if (product.id) {
                const productRef = doc(db, collectionName, product.id);
                const updateData = { ...product, updatedAt: timestamp, updatedBy: userId };
                delete updateData.id;
                await updateDoc(productRef, updateData);
                return product.id;
            } else {
                const newProduct = { ...product, createdAt: timestamp, createdBy: userId };
                const docRef = await addDoc(collection(db, collectionName), newProduct);
                return docRef.id;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene todos los productos almacenados en Firestore.
     * @param {string} userId - ID del usuario para filtrar productos (opcional).
     * @returns {Promise<Array>} - Lista de productos con sus datos e ID.
     */
    async getAllProducts(userId = null) {
        try {
            const collectionName = getFirestoreCollectionPath();
            let productsQuery;
            if (userId) {
                productsQuery = query(collection(db, collectionName), where('createdBy', '==', userId));
            } else {
                productsQuery = collection(db, collectionName);
            }
            const querySnapshot = await getDocs(productsQuery);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Elimina un producto por su ID.
     * @param {string} productId - ID del producto a eliminar.
     * @returns {Promise<boolean>} - `true` si la eliminación fue exitosa, `false` en caso de error.
     */
    async deleteProduct(productId) {
        try {
            const collectionName = getFirestoreCollectionPath();
            if (!productId) throw new Error("ID de producto no proporcionado");
            const productRef = doc(db, collectionName, productId);
            await deleteDoc(productRef);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Busca un producto en Firestore por su código de barras.
     * @param {string} barcode - Código de barras del producto.
     * @param {string} collectionNameOverride - Nombre de la colección para buscar (opcional).
     * @returns {Promise<Object|null>} - Datos del producto encontrado o `null` si no existe.
     */
    async getProductByBarcode(barcode, collectionNameOverride = null) {
        try {
            const collectionName = collectionNameOverride || getFirestoreCollectionPath();
            if (!barcode) throw new Error("Código de barras no proporcionado");
            const q = query(collection(db, collectionName), where('barcode', '==', barcode));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return null;
            const productDoc = querySnapshot.docs[0];
            return { id: productDoc.id, ...productDoc.data() };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene un producto por su ID.
     * @param {string} productId - ID del producto.
     * @returns {Promise<Object|null>} - Datos del producto o null si no existe.
     */
    async getProductById(productId) {
        try {
            const collectionName = getFirestoreCollectionPath();
            if (!productId) throw new Error("ID de producto no proporcionado");
            const productRef = doc(db, collectionName, productId);
            const productSnap = await getDoc(productRef);
            if (!productSnap.exists()) return null;
            return { id: productSnap.id, ...productSnap.data() };
        } catch (error) {
            throw error;
        }
    }
}

// Exporta la instancia de DatabaseService para ser usada en otros módulos
export const databaseService = new DatabaseService();
export default DatabaseService;