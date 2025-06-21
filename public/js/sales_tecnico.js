// sales_tecnico.js - Lógica de ventas para la vista de técnico
import { db } from "./config.js";
import { databaseService } from "./database.js";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();
const ADMIN_EMAIL = "jalcuza_58@hotmail.com";

const jsPDF = window.jspdf?.jsPDF;
if (!jsPDF) {
    console.error("❌ jsPDF no está disponible en sales_tecnico.js. Verifica la importación en tecnico.html.");
}

const salesModal_tecnico = document.getElementById("salesModal"); // Asumiendo mismo ID de modal
const openSalesModalBtn_tecnico = document.getElementById("openSalesModal");
const closeSalesModalBtn_tecnico = salesModal_tecnico?.querySelector(".close-btn");
const salesForm_tecnico = document.getElementById("salesForm");
const saleBarcodeInput_tecnico = document.getElementById("saleBarcode");
const saleProductNameInput_tecnico = document.getElementById("saleProductName");
const saleUserEmail_tecnico = document.getElementById("saleUserEmail"); // Si existe este campo en tecnico.html
const saleSubmitBtn_tecnico = salesForm_tecnico?.querySelector("button[type='submit']"); // Más específico

// No se necesita updateAdminPermissions aquí si tecnico siempre tiene los mismos permisos para sus productos.
// Si se requiere lógica de admin para mostrar/ocultar botones de edición/eliminación en la tabla
// de tecnico_products, esa lógica debería estar en product_tecnico.js o app_tecnico.js

openSalesModalBtn_tecnico?.addEventListener("click", () => {
    if (salesModal_tecnico) {
        salesModal_tecnico.classList.remove("hidden");
        salesModal_tecnico.style.display = "flex";
    }
    const user = auth.currentUser;
    if (saleUserEmail_tecnico && user) saleUserEmail_tecnico.value = user.email; // Si el campo existe
    if (saleBarcodeInput_tecnico) saleBarcodeInput_tecnico.focus();
});

closeSalesModalBtn_tecnico?.addEventListener("click", () => {
    if (salesModal_tecnico) {
        salesModal_tecnico.classList.add("hidden");
        salesModal_tecnico.style.display = "none";
    }
});

saleBarcodeInput_tecnico?.addEventListener("input", async () => {
    const barcode = saleBarcodeInput_tecnico.value.trim();
    if (!barcode) {
        if (saleProductNameInput_tecnico) saleProductNameInput_tecnico.value = "";
        return;
    }
    try {
        // Usar una función getProductByBarcode que busque en "tecnico_products"
        // Necesitaremos adaptar databaseService o crear una función específica.
        // Por ahora, asumimos que databaseService.getProductByBarcode se adaptará o crearemos una nueva.
        // Esta es una dependencia importante a resolver.
        // Alternativamente, podemos implementar la búsqueda aquí directamente.
        const product = await databaseService.getProductByBarcode(barcode, "tecnico_products"); // Indicamos la colección
        if (saleProductNameInput_tecnico) {
            saleProductNameInput_tecnico.value = product ? product.name : "No encontrado en tecnico_products";
        }
    } catch (error) {
        console.error("❌ Error al buscar el producto en tecnico_products:", error);
        if (saleProductNameInput_tecnico) saleProductNameInput_tecnico.value = "Error";
    }
});

async function handleSale_tecnico(event) {
    event.preventDefault();

    if (saleSubmitBtn_tecnico) saleSubmitBtn_tecnico.disabled = true;

    const barcode = saleBarcodeInput_tecnico.value.trim();
    const quantityInput = document.getElementById("saleQuantity");
    const quantity = parseInt(quantityInput.value, 10);

    const user = auth.currentUser;
    const userEmail = user ? user.email : "Desconocido (Técnico)";

    if (!barcode || !quantityInput || quantity <= 0) {
        alert("⚠️ Ingrese datos válidos para la venta (Técnico).");
        if (saleSubmitBtn_tecnico) saleSubmitBtn_tecnico.disabled = false;
        return;
    }

    try {
        // De nuevo, necesitamos una forma de obtener el producto de "tecnico_products"
        const product = await databaseService.getProductByBarcode(barcode, "tecnico_products");

        if (!product) {
            alert("⚠️ Producto no encontrado en el inventario de técnico.");
            if (saleSubmitBtn_tecnico) saleSubmitBtn_tecnico.disabled = false;
            return;
        }

        if (product.quantity < quantity) {
            alert("⚠️ No hay suficiente stock en el inventario de técnico.");
            if (saleSubmitBtn_tecnico) saleSubmitBtn_tecnico.disabled = false;
            return;
        }

        const newQuantity = product.quantity - quantity;
        const productRef = doc(db, "tecnico_products", product.id); // Referencia a tecnico_products
        await updateDoc(productRef, { quantity: newQuantity });

        // Registrar la venta en una colección de ventas general "sales" o una específica "sales_tecnico"
        // Por consistencia con sales.js, usaremos "sales" pero podríamos diferenciarla.
        const saleData = {
            barcode,
            productName: product.name,
            quantity,
            price: product.price,
            total: product.price * quantity,
            timestamp: serverTimestamp(),
            soldBy: userEmail,
            origin: "tecnico" // Para identificar que la venta vino de la sección tecnico
        };

        await addDoc(collection(db, "sales"), saleData); // A la colección general "sales"

        generateReceipt_tecnico(saleData); // Función específica para recibo

        alert("✅ Venta (Técnico) realizada con éxito.");
        if (salesModal_tecnico) salesModal_tecnico.classList.add("hidden");

        // Recargar los productos de técnico
        if (auth.currentUser && typeof loadProducts_tecnico === 'function') { // Asegurarse que loadProducts_tecnico está disponible
            loadProducts_tecnico(auth.currentUser.uid);
        } else {
            location.reload(); // Fallback si la función no está en el scope
        }

    } catch (error) {
        console.error("❌ Error en la venta (Técnico):", error);
        alert(`Ocurrió un error al procesar la venta (Técnico): ${error.message}`);
    } finally {
        if (saleSubmitBtn_tecnico) saleSubmitBtn_tecnico.disabled = false;
    }
}

function generateReceipt_tecnico(sale) {
    if (!jsPDF) {
        console.error("❌ jsPDF no está disponible para generar recibo de técnico.");
        return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Recibo de Venta (Técnico)", 70, 20); // Título modificado
    doc.setFontSize(12);
    doc.text(`Producto: ${sale.productName}`, 20, 40);
    doc.text(`Cantidad: ${sale.quantity}`, 20, 50);
    doc.text(`Precio unitario: $${sale.price.toFixed(2)}`, 20, 60);
    doc.text(`Total: $${sale.total.toFixed(2)}`, 20, 70);
    doc.text(`Fecha: ${new Date(sale.timestamp?.toDate() || Date.now()).toLocaleString()}`, 20, 80); // Manejar timestamp
    doc.text(`Vendido por: ${sale.soldBy}`, 20, 90);
    doc.text(`Origen: ${sale.origin || 'Técnico'}`, 20, 100);

    doc.save(`Recibo_Tecnico_${sale.barcode}_${Date.now()}.pdf`);
}

salesForm_tecnico?.addEventListener("submit", handleSale_tecnico);

// Adaptación necesaria en database.js:
// La función getProductByBarcode en database.js necesita ser modificada o
// duplicada para aceptar un argumento de colección.
// Ejemplo de modificación en database.js:
/*
async getProductByBarcode(barcode, collectionName = "products") { // default a "products"
    const q = query(collection(this.db, collectionName), where("barcode", "==", barcode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const productDoc = snapshot.docs[0];
    return { id: productDoc.id, ...productDoc.data() };
}
*/
// Esta modificación se hará en un paso posterior si es necesario, o se asumirá que ya existe.
// Por ahora, el código de sales_tecnico.js asume que puede pasar la colección.

// Es importante que `databaseService.getProductByBarcode` se actualice para poder buscar
// en la colección `tecnico_products`. Si no, las ventas de técnico fallarán al buscar el producto.
// Esto se abordará en el paso de revisión de `database.js` o se asumirá que se hace.
// Por ahora, el código de sales_tecnico.js está escrito asumiendo esta capacidad.

// También, `loadProducts_tecnico` debe estar disponible globalmente o importada correctamente
// en el contexto donde se llama después de una venta. tecnico.html debe asegurarse de esto.
// La importación y exportación de `loadProducts_tecnico` desde `product_tecnico.js` y su uso en `app_tecnico.js`
// debería manejar esto si `app_tecnico.js` es el script principal para la lógica de la página.
// La recarga `location.reload()` es un fallback.

console.log("sales_tecnico.js cargado y listeners configurados si los elementos existen.");
