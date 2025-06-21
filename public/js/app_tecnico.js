// app_tecnico.js - Principal para la página de inventario de tecnico
import { db, auth } from "./config.js";
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadProducts_tecnico } from "./product_tecnico.js"; // Cambiado
import { setupAuthStateListener } from "./auth.js";

let editingProductId_tecnico = null; // Variable específica para tecnico

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔹 DOM cargado en app_tecnico.js");

    setupAuthStateListener({
        onLogin: (user) => {
            console.log("🔹 Callback onLogin ejecutado en app_tecnico.js");
            loadProducts_tecnico(user.uid); // Función específica para tecnico
        },
        onLogout: () => {
            console.log("🔹 Callback onLogout ejecutado en app_tecnico.js");
        }
    });

    const productForm = document.getElementById("productForm");
    if (productForm) {
        productForm.addEventListener("submit", handleAddOrEditProduct_tecnico); // Función específica
    }
});

async function handleAddOrEditProduct_tecnico(event) { // Nombre de función específico
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
        if (editingProductId_tecnico) { // Variable específica
            const productRef = doc(db, "tecnico_products", editingProductId_tecnico); // Colección tecnico_products
            await updateDoc(productRef, {
                ...productData,
                updatedBy: currentUser.uid,
                updatedAt: new Date()
            });
            alert("✅ Producto actualizado exitosamente en tecnico_products");
        } else {
            await addDoc(collection(db, "tecnico_products"), { // Colección tecnico_products
                ...productData,
                createdBy: currentUser.uid,
                timestamp: new Date()
            });
            alert("✅ Producto agregado exitosamente a tecnico_products");
        }

        document.getElementById("productForm")?.reset();
        editingProductId_tecnico = null; // Variable específica
        loadProducts_tecnico(currentUser.uid); // Función específica
    } catch (error) {
        console.error("❌ Error al procesar producto en tecnico_products:", error);
        alert("Error al procesar el producto: " + error.message);
    }
}

export async function handleEditProduct_tecnico(productId) { // Nombre de función específico
    if (!db) {
        console.error("❌ Error: Firebase Firestore (db) no está inicializado.");
        alert("No se puede conectar a la base de datos.");
        return;
    }

    try {
        const productRef = doc(db, "tecnico_products", productId); // Colección tecnico_products
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            alert("❌ Producto no encontrado en tecnico_products.");
            return;
        }

        const productData = productSnap.data();

        if (productData) {
            document.getElementById("productName").value = productData.name || "";
            document.getElementById("price").value = productData.price ? productData.price.toFixed(2) : "";
            document.getElementById("category").value = productData.category || "";
            document.getElementById("quantity").value = productData.quantity || "";
            document.getElementById("barcode").value = productData.barcode || "";
            editingProductId_tecnico = productId; // Variable específica
        } else {
            console.warn("⚠️ Datos de producto no disponibles en tecnico_products.");
            alert("❌ Error al obtener los datos del producto.");
        }
    } catch (error) {
        console.error("❌ Error al cargar producto para edición en tecnico_products:", error);
        alert("Error al cargar el producto: " + error.message);
    }
}
