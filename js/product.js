import { db, auth } from "./config.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { handleEditProduct } from "./app.js"; // Importar la función de edición

/**
 * Carga los productos en la tabla del inventario.
 * @param {string} userId - ID del usuario autenticado.
 */
export async function loadProducts(userId) {
    const inventoryBody = document.getElementById("inventoryBody");
    if (!inventoryBody) {
        console.error("❌ No se encontró el elemento inventoryBody.");
        return;
    }

    inventoryBody.innerHTML = ""; // Limpiar la tabla antes de llenarla
    const fragment = document.createDocumentFragment(); // Optimización del acceso al DOM

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        if (querySnapshot.empty) {
            console.warn("⚠️ No hay productos en la base de datos.");
            inventoryBody.innerHTML = "<tr><td colspan='6'>No hay productos disponibles.</td></tr>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const row = document.createElement("tr");
            row.dataset.id = doc.id; // Se almacena el ID del producto en el dataset del <tr>

            row.innerHTML = `
                <td>${product.barcode}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>
                    <button class="edit-btn">✏️ Editar</button>
                    <button class="delete-btn">🗑️ Eliminar</button>
                </td>
            `;

            fragment.appendChild(row);
        });

        inventoryBody.appendChild(fragment); // Añadir todas las filas a la tabla en un solo paso

    } catch (error) {
        console.error("❌ Error al cargar productos:", error);
        alert("Ocurrió un error al cargar los productos. Inténtalo nuevamente.");
    }
}

// Delegación de eventos para evitar múltiples listeners
document.getElementById("inventoryBody")?.addEventListener("click", async (event) => {
    const target = event.target;
    const row = target.closest("tr");
    const productId = row?.dataset.id;

    if (!productId) return;

    if (target.classList.contains("edit-btn")) {
        handleEditProduct(productId);
    } else if (target.classList.contains("delete-btn")) {
        if (confirm("¿Seguro que deseas eliminar este producto?")) {
            try {
                await deleteDoc(doc(db, "products", productId));
                alert("✅ Producto eliminado correctamente.");
                loadProducts(auth.currentUser?.uid);
            } catch (error) {
                console.error("❌ Error al eliminar producto:", error);
                alert("Ocurrió un error al eliminar el producto.");
            }
        }
    }
});
