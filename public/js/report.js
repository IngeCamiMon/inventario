import { db } from "./config.js";
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;
const auth = getAuth();
const ADMIN_EMAIL = "jalcuza_58@hotmail.com"; // Reemplaza con el correo del administrador

// Botones de reporte
const inventoryReportBtn = document.getElementById("generateInventoryReport");
const salesReportBtn = document.getElementById("generateSalesReport");
const historicalReportBtn = document.getElementById("generateHistoricalReport"); // Botón para el reporte histórico

// Verificar si el usuario es administrador
onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) {
        // Mostrar el botón de reporte histórico solo para el administrador
        if (historicalReportBtn) {
            historicalReportBtn.style.display = "inline-block";
        }
    } else {
        // Ocultar el botón de reporte histórico para usuarios no administradores
        if (historicalReportBtn) {
            historicalReportBtn.style.display = "none";
        }
    }
});

// Función para generar el reporte de inventario
async function generateInventoryReport() {
    try {
        console.log("Iniciando generación de reporte de inventario...");
        const doc = new jsPDF();
        doc.text("Reporte de Inventario", 80, 20);
        
        // Agregar fecha y hora
        const fecha = new Date().toLocaleDateString();
        const hora = new Date().toLocaleTimeString();
        doc.text(`Fecha: ${fecha} - Hora: ${hora}`, 20, 30);
        
        // Encabezados de la tabla - AJUSTADO EL ESPACIADO
        doc.setFontSize(12);
        doc.text("Código", 15, 40);
        doc.text("Producto", 65, 40);
        doc.text("Categoría", 115, 40);
        doc.text("Cantidad", 155, 40);
        doc.text("Precio", 180, 40);
        
        // Línea bajo los encabezados
        doc.line(15, 42, 195, 42);
        
        let y = 50; // Posición inicial de los datos
        const lineHeight = 10; // Altura de cada línea
        const pageHeight = doc.internal.pageSize.height;
        
        console.log("Obteniendo datos de inventario...");
        const querySnapshot = await getDocs(collection(db, "products"));
        console.log(`Se encontraron ${querySnapshot.size} productos en el inventario`);
        
        // Si no hay productos
        if (querySnapshot.empty) {
            doc.text("No hay productos en el inventario", 80, y);
            doc.save("Reporte_Inventario.pdf");
            console.log("No hay productos para mostrar en el reporte");
            return;
        }
        
        // Debug: Imprimir las claves de los documentos para diagnóstico
        if (querySnapshot.size > 0) {
            const firstDoc = querySnapshot.docs[0].data();
            console.log("Claves del primer documento:", Object.keys(firstDoc));
        }
        
        querySnapshot.forEach((doc_product) => {
            const data = doc_product.data();
            
            // Debug: Imprimir todo el objeto para verificar la estructura
            console.log("Datos completos del producto:", data);
            
            // Verificar si necesitamos una nueva página
            if (y >= pageHeight - 20) {
                doc.addPage();
                console.log("Añadiendo nueva página al PDF");
                // Repetir encabezados en la nueva página
                doc.text("Código", 15, 20);
                doc.text("Producto", 65, 20);
                doc.text("Categoría", 115, 20);
                doc.text("Cantidad", 155, 20);
                doc.text("Precio", 180, 20);
                doc.line(15, 22, 195, 22); // Línea bajo los encabezados
                y = 30; // Reiniciar posición
            }
            
            try {
                // Buscar el nombre del producto en diferentes campos posibles
                let productName = "Sin nombre";
                
                // Comprobación para diferentes posibles nombres de campo
                if (data.productName) {
                    productName = data.productName;
                } else if (data.name) {
                    productName = data.name;
                } else if (data.producto) {
                    productName = data.producto;
                } else if (data.nombre) {
                    productName = data.nombre;
                }
                
                // Convertir datos a string para evitar errores
                const barcode = String(data.barcode || data.codigo || data.code || "-");
                
                // Limitar longitud del nombre y código para evitar desbordamiento
                let barcodeDisplay = barcode;
                if (barcodeDisplay.length > 18) {
                    barcodeDisplay = barcodeDisplay.substring(0, 15) + "...";
                }
                
                let productNameDisplay = productName;
                if (productNameDisplay.length > 20) {
                    productNameDisplay = productNameDisplay.substring(0, 17) + "...";
                }
                
                const category = String(data.category || data.categoria || "-");
                let categoryDisplay = category;
                if (categoryDisplay.length > 15) {
                    categoryDisplay = categoryDisplay.substring(0, 12) + "...";
                }
                
                const quantity = String(data.quantity || data.cantidad || "0");
                
                // Para el precio, asegurarse de que sea un número antes de usar toFixed
                let price = "0.00";
                if (data.price !== undefined && data.price !== null) {
                    price = parseFloat(data.price).toFixed(2);
                } else if (data.precio !== undefined && data.precio !== null) {
                    price = parseFloat(data.precio).toFixed(2);
                }
                
                // Agregar datos del producto al PDF - POSICIONES AJUSTADAS
                doc.text(barcodeDisplay, 15, y);
                doc.text(productNameDisplay, 65, y);
                doc.text(categoryDisplay, 115, y);
                doc.text(quantity, 155, y);
                doc.text(`${price}`, 180, y);
                
                y += lineHeight; // Avanzar a la siguiente línea
            } catch (dataError) {
                console.error("Error procesando datos del producto:", dataError);
                console.error("Datos del producto con error:", data);
                // Continuar con el siguiente producto
            }
        });
        
        console.log("Guardando PDF...");
        doc.save("Reporte_Inventario.pdf");
        console.log("Reporte de inventario generado con éxito");
    } catch (error) {
        console.error("Error generando el reporte de inventario:", error);
        alert("Error generando el reporte de inventario: " + error.message);
    }
}

// Función para generar el reporte de ventas (últimas 30 ventas)
async function generateSalesReport() {
    const doc = new jsPDF();
    doc.text("Reporte de Ventas del Día", 75, 20);

    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();
    doc.text(`Fecha: ${fecha} - Hora: ${hora}`, 20, 30);

    let y = 50; // Posición inicial en la página
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 50; // Altura de cada bloque de texto

    try {
        // Calcular el rango de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Obtener solo las ventas del día actual
        const q = query(
            collection(db, "sales"),
            where("timestamp", ">=", Timestamp.fromDate(today)),
            where("timestamp", "<", Timestamp.fromDate(tomorrow)),
            orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        let totalVentas = 0;

        doc.setFontSize(12);
        doc.text("Resumen de Ventas del Día", 80, 40);

        if (querySnapshot.empty) {
            doc.text("No hay ventas registradas hoy", 80, y);
            doc.save("Reporte_Ventas_Dia.pdf");
            return;
        }

        querySnapshot.forEach((sale) => {
            const data = sale.data();

            if (y + lineHeight > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }

            let productName = data.productName || data.name || data.producto || data.nombre || "Sin nombre";
            if (productName.length > 30) {
                productName = productName.substring(0, 27) + "...";
            }

            const quantity = data.quantity ?? data.cantidad ?? "Desconocido";
            const price = data.price ? `$${data.price.toFixed(2)}` : (data.precio ? `$${data.precio.toFixed(2)}` : "Precio no disponible");
            const total = data.total ? `$${data.total.toFixed(2)}` : "Total no disponible";
            const soldBy = data.soldBy || data.vendedor || "Vendedor desconocido";
            const timestamp = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : "Fecha no disponible";

            if (data.total) {
                totalVentas += data.total;
            }

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
        doc.text(`Total de Ventas: $${totalVentas.toFixed(2)}`, 80, y + 10);

        doc.save("Reporte_Ventas_Dia.pdf");
    } catch (error) {
        console.error("Error generando el reporte de ventas:", error);
        alert("Error generando el reporte de ventas.");
    }
}

// Función para generar el reporte histórico por días
async function generateHistoricalReport() {
    try {
        console.log("Iniciando generación de reporte histórico por días...");
        const doc = new jsPDF();
        doc.text("Reporte Histórico de Ventas por Días", 70, 20);
        
        const fecha = new Date().toLocaleDateString();
        const hora = new Date().toLocaleTimeString();
        doc.text(`Fecha: ${fecha} - Hora: ${hora}`, 20, 30);
        
        let y = 50; // Posición inicial en la página
        const pageHeight = doc.internal.pageSize.height;
        const headerHeight = 10; // Altura del encabezado de cada día
        const entryHeight = 8; // Altura de cada entrada de venta
        let totalHistorico = 0;
        
        try {
            console.log("Obteniendo datos de ventas...");
            const q = query(
                collection(db, "sales"),
                orderBy("timestamp", "desc") // Ordenar por fecha descendente
            );
            
            const querySnapshot = await getDocs(q);
            console.log(`Se encontraron ${querySnapshot.size} ventas en total`);
            
            // Si no hay ventas
            if (querySnapshot.empty) {
                doc.text("No hay ventas registradas", 80, y);
                doc.save("Reporte_Historico_Por_Dias.pdf");
                console.log("No hay ventas para mostrar en el reporte");
                return;
            }
            
            // Agrupar ventas por día
            const ventasPorDia = {};
            
            querySnapshot.forEach((sale) => {
                const data = sale.data();
                
                if (data.timestamp) {
                    // Convertir timestamp a fecha y formatearla como clave (YYYY-MM-DD)
                    const fecha = data.timestamp.toDate();
                    const fechaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
                    const fechaDisplay = fecha.toLocaleDateString();
                    
                    // Inicializar el día si no existe
                    if (!ventasPorDia[fechaKey]) {
                        ventasPorDia[fechaKey] = {
                            fecha: fechaDisplay,
                            ventas: [],
                            totalDia: 0
                        };
                    }
                    
                    // Buscar el nombre del producto
                    let productName = "Sin nombre";
                    if (data.productName) {
                        productName = data.productName;
                    } else if (data.name) {
                        productName = data.name;
                    } else if (data.producto) {
                        productName = data.producto;
                    } else if (data.nombre) {
                        productName = data.nombre;
                    }
                    
                    // Limitar longitud del nombre
                    if (productName.length > 30) {
                        productName = productName.substring(0, 27) + "...";
                    }
                    
                    // Calcular el total de la venta
                    let ventaTotal = 0;
                    if (data.total) {
                        ventaTotal = data.total;
                        ventasPorDia[fechaKey].totalDia += ventaTotal;
                        totalHistorico += ventaTotal; // Acumular al total histórico
                    }
                    
                    // Agregar la venta al día correspondiente
                    ventasPorDia[fechaKey].ventas.push({
                        producto: productName,
                        cantidad: data.quantity ?? data.cantidad ?? "Desconocido",
                        precio: data.price ? parseFloat(data.price) : (data.precio ? parseFloat(data.precio) : 0),
                        total: ventaTotal,
                        vendedor: data.soldBy || data.vendedor || "Vendedor desconocido",
                        hora: fecha.toLocaleTimeString()
                    });
                }
            });
            
            // Ordenar las fechas de más reciente a más antigua
            const fechasOrdenadas = Object.keys(ventasPorDia).sort().reverse();
            
            // Generar el reporte por día
            for (const fechaKey of fechasOrdenadas) {
                const diaDatos = ventasPorDia[fechaKey];
                
                // Verificar si necesitamos una nueva página
                if (y + headerHeight + (diaDatos.ventas.length * entryHeight) + 20 > pageHeight) {
                    doc.addPage();
                    y = 20; // Reiniciar posición
                }
                
                // Encabezado del día
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(`Día: ${diaDatos.fecha} - Total del día: $${diaDatos.totalDia.toFixed(2)}`, 20, y);
                doc.line(20, y + 2, 190, y + 2); // Línea bajo el encabezado del día
                y += headerHeight + 5; // Espacio después del encabezado
                
                // Encabezados de la tabla de ventas del día
                doc.setFontSize(10);
                doc.text("Producto", 20, y);
                doc.text("Cant.", 90, y);
                doc.text("Precio", 110, y);
                doc.text("Total", 140, y);
                doc.text("Hora", 170, y);
                doc.line(20, y + 2, 190, y + 2); // Línea bajo los encabezados
                y += 6; // Espacio después de los encabezados
                
                // Detalles de ventas del día
                doc.setFont(undefined, 'normal');
                for (const venta of diaDatos.ventas) {
                    // Verificar si necesitamos una nueva página
                    if (y + entryHeight > pageHeight - 10) {
                        doc.addPage();
                        y = 20;
                        // Repetir encabezados
                        doc.setFontSize(10);
                        doc.setFont(undefined, 'bold');
                        doc.text("Producto", 20, y);
                        doc.text("Cant.", 90, y);
                        doc.text("Precio", 110, y);
                        doc.text("Total", 140, y);
                        doc.text("Hora", 170, y);
                        doc.line(20, y + 2, 190, y + 2);
                        y += 6;
                        doc.setFont(undefined, 'normal');
                    }
                    
                    // Limitar el nombre del producto para la tabla
                    let productoDisplay = venta.producto;
                    if (productoDisplay.length > 30) {
                        productoDisplay = productoDisplay.substring(0, 27) + "...";
                    }
                    
                    doc.text(productoDisplay, 20, y);
                    doc.text(String(venta.cantidad), 90, y);
                    doc.text(`$${venta.precio.toFixed(2)}`, 110, y);
                    doc.text(`$${venta.total.toFixed(2)}`, 140, y);
                    doc.text(venta.hora, 170, y);
                    
                    y += entryHeight; // Espacio para la siguiente venta
                }
                
                // Línea separadora entre días
                doc.line(20, y, 190, y);
                y += 10; // Espacio antes del siguiente día
            }
            
            // Agregar el total histórico al final
            doc.addPage(); // Nueva página para el resumen
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text("Resumen del Reporte Histórico", 60, 30);
            
            doc.setFontSize(14);
            doc.text(`Total de Días: ${fechasOrdenadas.length}`, 60, 50);
            doc.text(`Total Histórico de Ventas: $${totalHistorico.toFixed(2)}`, 60, 65);
            
            console.log("Guardando PDF...");
            doc.save("Reporte_Historico_Por_Dias.pdf");
            console.log("Reporte histórico por días generado con éxito");
        } catch (error) {
            console.error("Error generando el reporte histórico:", error);
            alert("Error generando el reporte histórico: " + error.message);
        }
    } catch (error) {
        console.error("Error general:", error);
        alert("Error general: " + error.message);
    }
}

// Eventos de los botones
inventoryReportBtn?.addEventListener("click", generateInventoryReport);
salesReportBtn?.addEventListener("click", generateSalesReport);
historicalReportBtn?.addEventListener("click", generateHistoricalReport);