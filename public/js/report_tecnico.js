// report_tecnico.js - Lógica de reportes para la vista de técnico
import { db } from "./config.js";
import { collection, getDocs, query, orderBy, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const { jsPDF } = window.jspdf;
const auth = getAuth();
const ADMIN_EMAIL = "jalcuza_58@hotmail.com";

const inventoryReportBtn_tecnico = document.getElementById("generateInventoryReport");
const salesReportBtn_tecnico = document.getElementById("generateSalesReport");
const historicalReportBtn_tecnico = document.getElementById("generateHistoricalReport");

// La visibilidad de los botones de reporte para técnico podría ser siempre activa,
// o seguir la misma lógica de admin si solo el admin puede verlos incluso en la página de técnico.
// Por ahora, asumimos que técnico siempre puede generar sus propios reportes.
// Si la lógica de admin es necesaria, se puede replicar de report.js.

async function generateInventoryReport_tecnico() {
    try {
        const doc = new jsPDF();
        doc.text("Reporte de Inventario (Técnico)", 70, 20);
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

        const querySnapshot = await getDocs(collection(db, "tecnico_products")); // Colección tecnico_products

        if (querySnapshot.empty) {
            doc.text("No hay productos en el inventario de técnico.", 80, y);
            doc.save("Reporte_Inventario_Tecnico.pdf");
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

            let productName = data.name || data.productName || "Sin nombre";
            let barcodeDisplay = String(data.barcode || "-");
            if (barcodeDisplay.length > 18) barcodeDisplay = barcodeDisplay.substring(0, 15) + "...";
            if (productName.length > 20) productName = productName.substring(0, 17) + "...";
            let categoryDisplay = String(data.category || "-");
            if (categoryDisplay.length > 15) categoryDisplay = categoryDisplay.substring(0, 12) + "...";
            const quantity = String(data.quantity || "0");
            let price = "0.00";
            if (data.price !== undefined && data.price !== null) {
                price = parseFloat(data.price).toFixed(2);
            }

            doc.text(barcodeDisplay, 15, y);
            doc.text(productName, 65, y);
            doc.text(categoryDisplay, 115, y);
            doc.text(quantity, 155, y);
            doc.text(`${price}`, 180, y);
            y += lineHeight;
        });

        doc.save("Reporte_Inventario_Tecnico.pdf");
    } catch (error) {
        console.error("Error generando el reporte de inventario (Técnico):", error);
        alert("Error generando el reporte de inventario (Técnico): " + error.message);
    }
}

async function generateSalesReport_tecnico() {
    const doc = new jsPDF();
    doc.text("Reporte de Ventas del Día (Técnico)", 65, 20);
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();
    doc.text(`Fecha: ${fecha} - Hora: ${hora}`, 20, 30);

    let y = 50;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 50; // Altura de cada bloque de texto

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Filtrar ventas que originaron de "tecnico"
        const q = query(
            collection(db, "sales"), // Colección general de ventas
            where("timestamp", ">=", Timestamp.fromDate(today)),
            where("timestamp", "<", Timestamp.fromDate(tomorrow)),
            where("origin", "==", "tecnico"), // Filtrar por origen
            orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        let totalVentas = 0;

        doc.setFontSize(12);
        doc.text("Resumen de Ventas del Día (Técnico)", 70, 40);

        if (querySnapshot.empty) {
            doc.text("No hay ventas de técnico registradas hoy.", 70, y);
            doc.save("Reporte_Ventas_Dia_Tecnico.pdf");
            return;
        }

        querySnapshot.forEach((sale) => {
            const data = sale.data();
            if (y + lineHeight > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }

            let productName = data.productName || "Sin nombre";
            if (productName.length > 30) productName = productName.substring(0, 27) + "...";
            const quantity = data.quantity ?? "Desconocido";
            const price = data.price ? `$${data.price.toFixed(2)}` : "N/A";
            const total = data.total ? `$${data.total.toFixed(2)}` : "N/A";
            const soldBy = data.soldBy || "Desconocido";
            const timestamp = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : "N/A";

            if (data.total) totalVentas += data.total;

            doc.text(`Producto: ${productName}`, 20, y);
            doc.text(`Cantidad: ${quantity}`, 20, y + 10);
            doc.text(`Precio Unitario: ${price}`, 20, y + 20);
            doc.text(`Total: ${total}`, 20, y + 30);
            doc.text(`Vendido por: ${soldBy}`, 120, y + 10);
            doc.text(`Fecha: ${timestamp}`, 120, y + 20);
            doc.line(20, y + 40, 190, y + 40);
            y += lineHeight;
        });

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Total de Ventas (Técnico): $${totalVentas.toFixed(2)}`, 60, y + 10);
        doc.save("Reporte_Ventas_Dia_Tecnico.pdf");
    } catch (error) {
        console.error("Error generando el reporte de ventas (Técnico):", error);
        alert("Error generando el reporte de ventas (Técnico).");
    }
}

async function generateHistoricalReport_tecnico() {
    try {
        const doc = new jsPDF();
        doc.text("Reporte Histórico de Ventas por Días (Técnico)", 50, 20);
        const fechaActual = new Date().toLocaleDateString();
        const horaActual = new Date().toLocaleTimeString();
        doc.text(`Fecha: ${fechaActual} - Hora: ${horaActual}`, 20, 30);

        let y = 50;
        const pageHeight = doc.internal.pageSize.height;
        const headerHeight = 10;
        const entryHeight = 8;
        let totalHistorico = 0;

        const q = query(
            collection(db, "sales"), // Colección general de ventas
            where("origin", "==", "tecnico"), // Filtrar por origen
            orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            doc.text("No hay ventas de técnico registradas.", 80, y);
            doc.save("Reporte_Historico_Por_Dias_Tecnico.pdf");
            return;
        }

        const ventasPorDia = {};
        querySnapshot.forEach((sale) => {
            const data = sale.data();
            if (data.timestamp) {
                const fecha = data.timestamp.toDate();
                const fechaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
                const fechaDisplay = fecha.toLocaleDateString();

                if (!ventasPorDia[fechaKey]) {
                    ventasPorDia[fechaKey] = { fecha: fechaDisplay, ventas: [], totalDia: 0 };
                }

                let productName = data.productName || "Sin nombre";
                if (productName.length > 30) productName = productName.substring(0, 27) + "...";
                let ventaTotal = 0;
                if (data.total) {
                    ventaTotal = data.total;
                    ventasPorDia[fechaKey].totalDia += ventaTotal;
                    totalHistorico += ventaTotal;
                }

                ventasPorDia[fechaKey].ventas.push({
                    producto: productName,
                    cantidad: data.quantity ?? "N/A",
                    precio: data.price ? parseFloat(data.price) : 0,
                    total: ventaTotal,
                    vendedor: data.soldBy || "N/A",
                    hora: fecha.toLocaleTimeString()
                });
            }
        });

        const fechasOrdenadas = Object.keys(ventasPorDia).sort().reverse();

        for (const fechaKey of fechasOrdenadas) {
            const diaDatos = ventasPorDia[fechaKey];
            if (y + headerHeight + (diaDatos.ventas.length * entryHeight) + 20 > pageHeight) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`Día: ${diaDatos.fecha} - Total del día: $${diaDatos.totalDia.toFixed(2)}`, 20, y);
            doc.line(20, y + 2, 190, y + 2);
            y += headerHeight + 5;

            doc.setFontSize(10);
            doc.text("Producto", 20, y);
            doc.text("Cant.", 90, y);
            doc.text("Precio", 110, y);
            doc.text("Total", 140, y);
            doc.text("Hora", 170, y);
            doc.line(20, y + 2, 190, y + 2);
            y += 6;

            doc.setFont(undefined, 'normal');
            for (const venta of diaDatos.ventas) {
                if (y + entryHeight > pageHeight - 10) {
                    doc.addPage();
                    y = 20;
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text("Producto", 20, y); doc.text("Cant.", 90, y); doc.text("Precio", 110, y); doc.text("Total", 140, y); doc.text("Hora", 170, y);
                    doc.line(20, y + 2, 190, y + 2);
                    y += 6;
                    doc.setFont(undefined, 'normal');
                }
                let productoDisplay = venta.producto;
                if (productoDisplay.length > 30) productoDisplay = productoDisplay.substring(0, 27) + "...";

                doc.text(productoDisplay, 20, y);
                doc.text(String(venta.cantidad), 90, y);
                doc.text(`$${venta.precio.toFixed(2)}`, 110, y);
                doc.text(`$${venta.total.toFixed(2)}`, 140, y);
                doc.text(venta.hora, 170, y);
                y += entryHeight;
            }
            doc.line(20, y, 190, y);
            y += 10;
        }

        doc.addPage();
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text("Resumen del Reporte Histórico (Técnico)", 40, 30);
        doc.setFontSize(14);
        doc.text(`Total de Días con Ventas (Técnico): ${fechasOrdenadas.length}`, 40, 50);
        doc.text(`Total Histórico de Ventas (Técnico): $${totalHistorico.toFixed(2)}`, 40, 65);

        doc.save("Reporte_Historico_Por_Dias_Tecnico.pdf");
    } catch (error) {
        console.error("Error generando el reporte histórico (Técnico):", error);
        alert("Error generando el reporte histórico (Técnico): " + error.message);
    }
}

inventoryReportBtn_tecnico?.addEventListener("click", generateInventoryReport_tecnico);
salesReportBtn_tecnico?.addEventListener("click", generateSalesReport_tecnico);
historicalReportBtn_tecnico?.addEventListener("click", generateHistoricalReport_tecnico);

console.log("report_tecnico.js cargado.");
