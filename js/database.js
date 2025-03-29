// database.js
// Importa la instancia de Firestore desde config.js
import { db } from './config.js';

// Importa las funciones necesarias de Firestore
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    query, 
    where 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

/**
 * Clase que gestiona las operaciones CRUD en la base de datos Firestore.
 */
class DatabaseService {
    constructor() {
        // Verifica que la instancia de db esté disponible
        if (!db) {
            console.error("❌ Error: La instancia de Firestore no está disponible");
            throw new Error("Firestore no inicializado");
        }
        
        // Colección para productos
        this.productsCollection = 'products'; // Importante: Usa el mismo nombre en toda la app
    }

    /**
     * Guarda o actualiza un producto en Firestore.
     * @param {Object} product - Datos del producto.
     * @param {string} userId - ID del usuario que crea/actualiza el producto.
     * @returns {Promise<string>} - ID del producto guardado o actualizado.
     */
    async saveProduct(product, userId) {
        try {
            if (!product || typeof product !== 'object') {
                throw new Error("⚠️ Datos del producto inválidos");
            }

            if (!userId) {
                throw new Error("⚠️ ID de usuario no proporcionado");
            }

            console.log("📤 Guardando producto en Firestore:", product);

            // Prepara datos comunes
            const timestamp = new Date();
            
            if (product.id) {
                // Actualización de producto existente
                const productRef = doc(db, this.productsCollection, product.id);
                
                // Datos para actualización
                const updateData = {
                    ...product,
                    updatedAt: timestamp,
                    updatedBy: userId
                };
                
                // Elimina el ID del objeto para no sobrescribirlo en Firestore
                delete updateData.id;
                
                await updateDoc(productRef, updateData);
                console.log("✅ Producto actualizado:", product.id);
                return product.id;
            } else {
                // Creación de nuevo producto
                const newProduct = {
                    ...product,
                    createdAt: timestamp,
                    createdBy: userId
                };
                
                const docRef = await addDoc(collection(db, this.productsCollection), newProduct);
                console.log("✅ Nuevo producto guardado con ID:", docRef.id);
                return docRef.id;
            }
        } catch (error) {
            console.error("❌ Error al guardar producto:", error.message);
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
            let productsQuery;
            
            if (userId) {
                // Obtener solo productos del usuario actual
                productsQuery = query(
                    collection(db, this.productsCollection), 
                    where('createdBy', '==', userId)
                );
            } else {
                // Obtener todos los productos
                productsQuery = collection(db, this.productsCollection);
            }
            
            const querySnapshot = await getDocs(productsQuery);
            const products = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log(`📦 Productos obtenidos (${products.length}):`, products);
            return products;
        } catch (error) {
            console.error("❌ Error al obtener productos:", error.message);
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
            if (!productId) {
                throw new Error("⚠️ ID de producto no proporcionado");
            }

            const productRef = doc(db, this.productsCollection, productId);
            await deleteDoc(productRef);
            console.log("🗑️ Producto eliminado:", productId);
            return true;
        } catch (error) {
            console.error("❌ Error al eliminar producto:", error.message);
            return false;
        }
    }

    /**
     * Busca un producto en Firestore por su código de barras.
     * @param {string} barcode - Código de barras del producto.
     * @returns {Promise<Object|null>} - Datos del producto encontrado o `null` si no existe.
     */
    async getProductByBarcode(barcode) {
        try {
            if (!barcode) {
                throw new Error("⚠️ Código de barras no proporcionado");
            }

            const q = query(
                collection(db, this.productsCollection), 
                where('barcode', '==', barcode)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                console.warn("⚠️ No se encontró un producto con el código de barras:", barcode);
                return null;
            }
            
            const productDoc = querySnapshot.docs[0];
            const product = {
                id: productDoc.id,
                ...productDoc.data()
            };
            
            console.log("🔍 Producto encontrado:", product);
            return product;
        } catch (error) {
            console.error("❌ Error al buscar producto:", error.message);
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
            if (!productId) {
                throw new Error("⚠️ ID de producto no proporcionado");
            }
            
            const productRef = doc(db, this.productsCollection, productId);
            const productSnap = await getDoc(productRef);
            
            if (!productSnap.exists()) {
                console.warn("⚠️ No se encontró el producto con ID:", productId);
                return null;
            }
            
            const product = {
                id: productSnap.id,
                ...productSnap.data()
            };
            
            console.log("🔍 Producto encontrado:", product);
            return product;
        } catch (error) {
            console.error("❌ Error al obtener producto por ID:", error.message);
            throw error;
        }
    }
}

// Exporta la instancia de DatabaseService para ser usada en otros módulos
export const databaseService = new DatabaseService();

// También exporta la clase para poder crear nuevas instancias si es necesario
export default DatabaseService;