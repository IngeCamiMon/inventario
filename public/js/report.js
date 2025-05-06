import { db } from "./config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const { jsPDF } = window.jspdf;
const auth = getAuth();

// Botones de reporte
const inventoryReportBtn = document.getElementById("generateInventoryReport");
const salesReportBtn = document.getElementById("generateSalesReport");

// Función para generar el reporte de inventario
async function generateInventoryReport() {
    const doc = new jsPDF();
    doc.text("Reporte de Inventario", 80, 20);
    let y = 40; // Posición inicial en la página
    const pageHeight = doc.internal.pageSize.height; // Altura de la página
    const lineHeight = 50; // Altura de cada bloque de texto

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach((product) => {
            const data = product.data();
            console.log("Producto obtenido:", data); // Debugging

            const productName = data.productName || data.name || "Sin nombre";
            const category = data.category || "Sin categoría";
            const quantity = data.quantity ?? "Desconocido";
            const price = data.price ? `$${data.price.toFixed(2)}` : "Precio no disponible";

            // Verificar si hay suficiente espacio en la página actual
            if (y + lineHeight > pageHeight - 20) {
                doc.addPage(); // Agregar una nueva página
                y = 20; // Reiniciar la posición vertical
            }

            doc.text(`Producto: ${productName}`, 20, y);
            doc.text(`Categoría: ${category}`, 20, y + 10);
            doc.text(`Cantidad: ${quantity}`, 20, y + 20);
            doc.text(`Precio: ${price}`, 20, y + 30);
            doc.line(20, y + 35, 190, y + 35); // Línea separadora
            y += lineHeight; // Incrementar la posición vertical
        });

        doc.save("Reporte_Inventario.pdf");
    } catch (error) {
        console.error("Error generando el reporte de inventario:", error);
        alert("Error generando el reporte.");
    }
}

// Función para generar el reporte de ventas del día actual
async function generateSalesReport() {
    const doc = new jsPDF();
    doc.text("Reporte de Ventas", 80, 20);
    let y = 40; // Posición inicial en la página
    const pageHeight = doc.internal.pageSize.height; // Altura de la página
    const lineHeight = 65; // Altura de cada bloque de texto
    let totalSales = 0;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const q = query(
            collection(db, "sales"),
            where("timestamp", ">=", today),
            where("timestamp", "<", tomorrow)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((sale) => {
            const data = sale.data();
            console.log("Venta obtenida:", data); // Debugging

            const productName = data.productName || "Sin nombre";
            const quantity = data.quantity ?? "Desconocido";
            const price = data.price ? `$${data.price.toFixed(2)}` : "Precio no disponible";
            const total = data.total ? `$${data.total.toFixed(2)}` : "Total no disponible";
            const soldBy = data.soldBy || "Vendedor desconocido";
            const timestamp = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : "Fecha no disponible";

            totalSales += data.total || 0;

            // Verificar si hay suficiente espacio en la página actual
            if (y + lineHeight > pageHeight - 20) {
                doc.addPage(); // Agregar una nueva página
                y = 20; // Reiniciar la posición vertical
            }

            doc.text(`Producto: ${productName}`, 20, y);
            doc.text(`Cantidad: ${quantity}`, 20, y + 10);
            doc.text(`Precio Unitario: ${price}`, 20, y + 20);
            doc.text(`Total: ${total}`, 20, y + 30);
            doc.text(`Vendido por: ${soldBy}`, 20, y + 40);
            doc.text(`Fecha: ${timestamp}`, 20, y + 50);
            doc.line(20, y + 55, 190, y + 55); // Línea separadora
            y += lineHeight; // Incrementar la posición vertical
        });

        // Agregar el total de ventas al final
        if (y + 20 > pageHeight - 20) {
            doc.addPage(); // Agregar una nueva página si no hay espacio
            y = 20;
        }
        doc.text(`Total de ventas del día: $${totalSales.toFixed(2)}`, 20, y + 20);

        doc.save("Reporte_Ventas_Hoy.pdf");
    } catch (error) {
        console.error("Error generando el reporte de ventas:", error);
        alert("Error generando el reporte.");
    }
}

// Eventos de los botones
inventoryReportBtn?.addEventListener("click", generateInventoryReport);
salesReportBtn?.addEventListener("click", generateSalesReport);
