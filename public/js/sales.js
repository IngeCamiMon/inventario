import { db } from "./config.js";
import { databaseService } from "./database.js"; 
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();
const ADMIN_EMAIL = "camilo-156@hotmail.com"; // Reemplaza con el correo del usuario autorizado

// Verificar si jsPDF está correctamente cargado
const jsPDF = window.jspdf?.jsPDF;
if (!jsPDF) {
    console.error("❌ jsPDF no está disponible. Verifica la importación en el HTML.");
}

// Obtener elementos del DOM
const salesModal = document.getElementById("salesModal");
const openSalesModalBtn = document.getElementById("openSalesModal");
const closeSalesModalBtn = document.querySelector(".close-btn");
const salesForm = document.getElementById("salesForm");
const saleBarcodeInput = document.getElementById("saleBarcode");
const saleProductNameInput = document.getElementById("saleProductName"); // Nuevo campo para mostrar el nombre

// Agregar campo de usuario en la venta
const saleUserEmail = document.getElementById("saleUserEmail");

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        const isAdmin = user && user.email === ADMIN_EMAIL;

        function updateButtonPermissions() {
            document.querySelectorAll(".edit-btn, .delete-btn").forEach(btn => {
                btn.style.display = isAdmin ? "inline-block" : "none";
            });
        }

        // Observar cambios en la lista de productos y actualizar permisos
        const observer = new MutationObserver(() => {
            updateButtonPermissions();
        });

        const inventoryBody = document.getElementById("inventoryBody"); // ID correcto
        if (inventoryBody) {
            observer.observe(inventoryBody, { childList: true, subtree: true });
        }

        updateButtonPermissions();
    });
});

// Abrir la ventana modal
openSalesModalBtn?.addEventListener("click", () => {
    salesModal.classList.remove("hidden");
    salesModal.style.display = "flex";
    
    // Mostrar el usuario autenticado en la venta
    const user = auth.currentUser;
    saleUserEmail.value = user ? user.email : "Desconocido";
});

// Cerrar la ventana modal
closeSalesModalBtn?.addEventListener("click", () => {
    salesModal.classList.add("hidden");
    salesModal.style.display = "none";
});

// Autocompletar el nombre del producto al ingresar código de barras
saleBarcodeInput?.addEventListener("input", async () => {
    const barcode = saleBarcodeInput.value.trim();
    if (!barcode) {
        saleProductNameInput.value = "";
        return;
    }
    try {
        const product = await databaseService.getProductByBarcode(barcode);
        saleProductNameInput.value = product ? product.name : "No encontrado";
    } catch (error) {
        console.error("❌ Error al buscar el producto:", error);
        saleProductNameInput.value = "Error";
    }
});

// Manejar la venta
async function handleSale(event) {
    event.preventDefault();

    const barcode = saleBarcodeInput.value.trim();
    const quantity = parseInt(document.getElementById("saleQuantity").value, 10);
    const user = auth.currentUser; // Obtener usuario autenticado
    const userEmail = user ? user.email : "Desconocido";

    if (!barcode || quantity <= 0) {
        alert("⚠️ Ingrese datos válidos para la venta.");
        return;
    }

    try {
        const product = await databaseService.getProductByBarcode(barcode);
        
        if (!product) {
            alert("⚠️ Producto no encontrado.");
            return;
        }

        if (product.quantity < quantity) {
            alert("⚠️ No hay suficiente stock.");
            return;
        }

        // Actualizar stock
        const newQuantity = product.quantity - quantity;
        const productRef = doc(db, "products", product.id);
        await updateDoc(productRef, { quantity: newQuantity });

        // Registrar la venta
        const saleData = {
            barcode,
            productName: product.name,
            quantity,
            price: product.price,
            total: product.price * quantity,
            timestamp: serverTimestamp(),
            soldBy: userEmail // Guardar quién realizó la venta
        };

        await addDoc(collection(db, "sales"), saleData);

        // Generar recibo
        generateReceipt(saleData);

        alert("✅ Venta realizada con éxito.");
        salesModal.classList.add("hidden"); // Solo cerrar si fue exitosa
        location.reload(); // Recargar la página del inventario
    } catch (error) {
        console.error("❌ Error en la venta:", error);
        alert(`Ocurrió un error al procesar la venta: ${error.message}`);
    }
}

/**
 * Genera un recibo en PDF con jsPDF.
 */
function generateReceipt(sale) {
    if (!jsPDF) {
        console.error("❌ jsPDF no está disponible.");
        return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Recibo de Venta", 80, 20);
    doc.setFontSize(12);
    doc.text(`Producto: ${sale.productName}`, 20, 40);
    doc.text(`Cantidad: ${sale.quantity}`, 20, 50);
    doc.text(`Precio unitario: $${sale.price.toFixed(2)}`, 20, 60);
    doc.text(`Total: $${sale.total.toFixed(2)}`, 20, 70);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 80);
    doc.text(`Vendido por: ${sale.soldBy}`, 20, 90); // Agregar usuario al PDF

    doc.save(`Recibo_${sale.barcode}.pdf`);
}

// Agregar evento al formulario de ventas
salesForm?.addEventListener("submit", handleSale);
