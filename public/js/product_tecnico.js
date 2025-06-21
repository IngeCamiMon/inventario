// product_tecnico.js - Manejo de productos para la vista de tecnico
import { db, auth } from "./config.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { handleEditProduct_tecnico } from "./app_tecnico.js"; // Importar la función de edición específica

/**
 * Carga los productos en la tabla del inventario para tecnico.
 * @param {string} userId - ID del usuario autenticado.
 */
export async function loadProducts_tecnico(userId) { // Nombre de función específico
    const inventoryBody = document.getElementById("inventoryBody");
    if (!inventoryBody) {
        console.error("❌ No se encontró el elemento inventoryBody en tecnico.html.");
        return;
    }

    inventoryBody.innerHTML = "";
    const fragment = document.createDocumentFragment();

    try {
        const querySnapshot = await getDocs(collection(db, "tecnico_products")); // Colección tecnico_products
        if (querySnapshot.empty) {
            console.warn("⚠️ No hay productos en la colección tecnico_products.");
            inventoryBody.innerHTML = "<tr><td colspan='6'>No hay productos disponibles para técnico.</td></tr>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const row = document.createElement("tr");
            row.dataset.id = doc.id;

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
            // Nota: la clase "admin-only-col" para cantidad no se usa aquí, se asume que tecnico siempre ve la cantidad.
            // Si se necesita lógica de admin aquí, se debería pasar el rol o verificarlo.

            fragment.appendChild(row);
        });

        inventoryBody.appendChild(fragment);

    } catch (error) {
        console.error("❌ Error al cargar productos de tecnico_products:", error);
        alert("Ocurrió un error al cargar los productos de técnico. Inténtalo nuevamente.");
    }
}

document.getElementById("inventoryBody")?.addEventListener("click", async (event) => {
    const target = event.target;
    const row = target.closest("tr");
    const productId = row?.dataset.id;

    if (!productId) return;

    // Asegurarse que este listener solo actúe en tecnico.html
    // Podríamos añadir una verificación si este script se carga en múltiples páginas,
    // pero como tecnico.html cargará explícitamente product_tecnico.js, está implícito.

    if (target.classList.contains("edit-btn")) {
        handleEditProduct_tecnico(productId); // Función específica
    } else if (target.classList.contains("delete-btn")) {
        if (confirm("¿Seguro que deseas eliminar este producto de tecnico_products?")) {
            try {
                await deleteDoc(doc(db, "tecnico_products", productId)); // Colección tecnico_products
                alert("✅ Producto eliminado correctamente de tecnico_products.");
                if (auth.currentUser) {
                    loadProducts_tecnico(auth.currentUser.uid); // Función específica
                }
            } catch (error) {
                console.error("❌ Error al eliminar producto de tecnico_products:", error);
                alert("Ocurrió un error al eliminar el producto de técnico.");
            }
        }
    }
});
