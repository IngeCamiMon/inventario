// app_gamer.js modificado para usar la colección "gamer"
import { db, auth } from "./config.js";
import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadProducts } from "./product.js";
import { setupAuthStateListener } from "./auth.js";

let editingProductId = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔹 DOM cargado en app.js");

    setupAuthStateListener({
        onLogin: (user) => {
            console.log("🔹 Callback onLogin ejecutado en app.js");
            loadProducts(user.uid);
        },
        onLogout: () => {
            console.log("🔹 Callback onLogout ejecutado en app.js");
        }
    });

    const productForm = document.getElementById("productForm");
    if (productForm) {
        productForm.addEventListener("submit", handleAddOrEditProduct);
    }
});

async function handleAddOrEditProduct(event) {
    event.preventDefault();

    const productName = document.getElementById("productName");
    const productPrice = document.getElementById("price");
    const productCategory = document.getElementById("category");
    const productQuantity = document.getElementById("quantity");
    const productBarcode = document.getElementById("barcode");

    if (!productName || !productPrice || !productCategory || !productQuantity || !productBarcode) {
        alert("⚠️ Todos los campos son obligatorios.");
        return;
    }

    const productData = {
        name: productName.value.trim(),
        price: parseFloat(productPrice.value) || 0,
        category: productCategory.value.trim(),
        quantity: parseInt(productQuantity.value, 10) || 0,
        barcode: productBarcode.value.trim()
    };

    if (!auth.currentUser) {
        console.warn("⚠️ Usuario no autenticado. No se puede procesar el producto.");
        alert("❌ Debes iniciar sesión para agregar o editar productos.");
        return;
    }

    const currentUser = auth.currentUser;

    try {
        if (editingProductId) {
            const productRef = doc(db, "gamer", editingProductId);
            await updateDoc(productRef, {
                ...productData,
                updatedBy: currentUser.uid,
                updatedAt: new Date()
            });
            alert("✅ Producto actualizado exitosamente");
        } else {
            await addDoc(collection(db, "gamer"), {
                ...productData,
                createdBy: currentUser.uid,
                timestamp: new Date()
            });
            alert("✅ Producto agregado exitosamente");
        }

        document.getElementById("productForm")?.reset();
        editingProductId = null;
        loadProducts(currentUser.uid);
    } catch (error) {
        console.error("❌ Error al procesar producto:", error);
        alert("Error al procesar el producto: " + error.message);
    }
}

export async function handleEditProduct(productId) {
    if (!db) {
        console.error("❌ Error: Firebase Firestore (db) no está inicializado.");
        alert("No se puede conectar a la base de datos.");
        return;
    }

    try {
        const productRef = doc(db, "gamer", productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            alert("❌ Producto no encontrado.");
            return;
        }

        const productData = productSnap.data();

        if (productData) {
            document.getElementById("productName").value = productData.name || "";
            document.getElementById("price").value = productData.price ? productData.price.toFixed(2) : "";
            document.getElementById("category").value = productData.category || "";
            document.getElementById("quantity").value = productData.quantity || "";
            document.getElementById("barcode").value = productData.barcode || "";
            editingProductId = productId;
        } else {
            console.warn("⚠️ Datos de producto no disponibles.");
            alert("❌ Error al obtener los datos del producto.");
        }
    } catch (error) {
        console.error("❌ Error al cargar producto para edición:", error);
        alert("Error al cargar el producto: " + error.message);
    }
}
