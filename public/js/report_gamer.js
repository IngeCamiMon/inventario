import { db } from "./config.js";
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;
const auth = getAuth();
const ADMIN_EMAIL = "jalcuza_58@hotmail.com";

const inventoryReportBtn = document.getElementById("generateInventoryReport");
const salesReportBtn = document.getElementById("generateSalesReport");
const historicalReportBtn = document.getElementById("generateHistoricalReport");

onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) {
        if (historicalReportBtn) historicalReportBtn.style.display = "inline-block";
        if (inventoryReportBtn) inventoryReportBtn.style.display = "inline-block";
    } else {
        if (historicalReportBtn) historicalReportBtn.style.display = "none";
        if (inventoryReportBtn) inventoryReportBtn.style.display = "none";
    }
});

// Función para generar el reporte de inventario (usa colección "gamer")
async function generateInventoryReport() {
    try {
        const doc = new jsPDF();
        doc.text("Reporte de Inventario", 80, 20);

        const fecha = new Date().toLocaleDateString();
        const hora = new Date().toLocaleTimeString();
        doc.text(`Fecha: ${fecha} - Hora: ${hora}`, 20, 30);

        doc.setFontSize(12);
        doc.text("Código", 15, 40);
        doc.text("Producto", 65, 40);
        doc.text("Categoría", 115, 40);
        doc.text("Cantidad", 155, 40);
        doc.text("Precio", 180, 40);
        doc.line(15, 42, 195, 42);

        let y = 50;
        const lineHeight = 10;
        const pageHeight = doc.internal.pageSize.height;

        const querySnapshot = await getDocs(collection(db, "gamer")); // <-- Cambio aquí

        if (querySnapshot.empty) {
            doc.text("No hay productos en el inventario", 80, y);
            doc.save("Reporte_Inventario.pdf");
            return;
        }

        querySnapshot.forEach((doc_product) => {
            const data = doc_product.data();
            if (y >= pageHeight - 20) {
                doc.addPage();
                doc.text("Código", 15, 20);
                doc.text("Producto", 65, 20);
                doc.text("Categoría", 115, 20);
                doc.text("Cantidad", 155, 20);
                doc.text("Precio", 180, 20);
                doc.line(15, 22, 195, 22);
                y = 30;
            }

            let productName = data.productName || data.name || data.producto || data.nombre || "Sin nombre";
            if (productName.length > 20) productName = productName.substring(0, 17) + "...";

            const barcode = String(data.barcode || data.codigo || data.code || "-");
            const barcodeDisplay = barcode.length > 18 ? barcode.substring(0, 15) + "..." : barcode;

            const category = String(data.category || data.categoria || "-");
            const categoryDisplay = category.length > 15 ? category.substring(0, 12) + "..." : category;

            const quantity = String(data.quantity || data.cantidad || "0");
            const price = data.price !== undefined ? parseFloat(data.price).toFixed(2)
                          : (data.precio ? parseFloat(data.precio).toFixed(2) : "0.00");

            doc.text(barcodeDisplay, 15, y);
            doc.text(productName, 65, y);
            doc.text(categoryDisplay, 115, y);
            doc.text(quantity, 155, y);
            doc.text(`${price}`, 180, y);

            y += lineHeight;
        });

        doc.save("Reporte_Inventario.pdf");
    } catch (error) {
        console.error("Error generando el reporte de inventario:", error);
        alert("Error generando el reporte de inventario: " + error.message);
    }
}

// Las funciones de reporte de ventas no necesitan cambiar porque usan la colección "sales"
inventoryReportBtn?.addEventListener("click", generateInventoryReport);
salesReportBtn?.addEventListener("click", generateSalesReport);
historicalReportBtn?.addEventListener("click", generateHistoricalReport);
