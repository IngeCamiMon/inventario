import { db } from "./config.js";
import { databaseService } from "./database.js"; 
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();
const ADMIN_EMAIL = "jalcuza_58@hotmail.com";

const jsPDF = window.jspdf?.jsPDF;
if (!jsPDF) {
    console.error("❌ jsPDF no está disponible. Verifica la importación en el HTML.");
}

const salesModal = document.getElementById("salesModal");
const openSalesModalBtn = document.getElementById("openSalesModal");
const closeSalesModalBtn = document.querySelector(".close-btn");
const salesForm = document.getElementById("salesForm");
const saleBarcodeInput = document.getElementById("saleBarcode");
const saleProductNameInput = document.getElementById("saleProductName");
const saleUserEmail = document.getElementById("saleUserEmail");
const saleSubmitBtn = document.getElementById("saleSubmitBtn");

function updateAdminPermissions(isAdmin) {
    document.querySelectorAll(".edit-btn, .delete-btn").forEach(btn => {
        btn.style.display = isAdmin ? "inline-block" : "none";
    });
    document.querySelectorAll(".admin-only-col").forEach(col => {
        col.style.display = isAdmin ? "" : "none";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        const isAdmin = user && user.email === ADMIN_EMAIL;
        updateAdminPermissions(isAdmin);

        const inventoryBody = document.getElementById("inventoryBody");
        if (inventoryBody) {
            const observer = new MutationObserver(() => {
                updateAdminPermissions(isAdmin);
            });
            observer.observe(inventoryBody, { childList: true, subtree: true });
        }
    });
});

openSalesModalBtn?.addEventListener("click", () => {
    salesModal.classList.remove("hidden");
    salesModal.style.display = "flex";
    const user = auth.currentUser;
    if (saleUserEmail) saleUserEmail.value = user ? user.email : "Desconocido";
});

closeSalesModalBtn?.addEventListener("click", () => {
    salesModal.classList.add("hidden");
    salesModal.style.display = "none";
});

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

async function handleSale(event) {
    event.preventDefault();

    if (saleSubmitBtn) saleSubmitBtn.disabled = true;

    const barcode = saleBarcodeInput.value.trim();
    const quantity = parseInt(document.getElementById("saleQuantity").value, 10);
    const user = auth.currentUser;
    const userEmail = user ? user.email : "Desconocido";

    if (!barcode || quantity <= 0) {
        alert("⚠️ Ingrese datos válidos para la venta.");
        if (saleSubmitBtn) saleSubmitBtn.disabled = false;
        return;
    }

    try {
        const product = await databaseService.getProductByBarcode(barcode);
        
        if (!product) {
            alert("⚠️ Producto no encontrado.");
            if (saleSubmitBtn) saleSubmitBtn.disabled = false;
            return;
        }

        if (product.quantity < quantity) {
            alert("⚠️ No hay suficiente stock.");
            if (saleSubmitBtn) saleSubmitBtn.disabled = false;
            return;
        }

        // Actualiza el stock en la colección "gamer"
        const newQuantity = product.quantity - quantity;
        const productRef = doc(db, "gamer", product.id);
        await updateDoc(productRef, { quantity: newQuantity });

        const saleData = {
            barcode,
            productName: product.name,
            quantity,
            price: product.price,
            total: product.price * quantity,
            timestamp: serverTimestamp(),
            soldBy: userEmail
        };

        await addDoc(collection(db, "sales"), saleData);

        generateReceipt(saleData);

        alert("✅ Venta realizada con éxito.");
        salesModal.classList.add("hidden");
        location.reload();
    } catch (error) {
        console.error("❌ Error en la venta:", error);
        alert(`Ocurrió un error al procesar la venta: ${error.message}`);
        if (saleSubmitBtn) saleSubmitBtn.disabled = false;
    }
}

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
    doc.text(`Vendido por: ${sale.soldBy}`, 20, 90);

    doc.save(`Recibo_${sale.barcode}.pdf`);
}

salesForm?.addEventListener("submit", handleSale);
