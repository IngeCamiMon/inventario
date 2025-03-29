// config.js - Solo para inicialización y exportación de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = { 
    apiKey: "AIzaSyAZtKXM2ph28A7LvuhuxlqazX0pTAI5Mjw",
    authDomain: "sistema-de-inventario-3d3f4.firebaseapp.com",
    projectId: "sistema-de-inventario-3d3f4",
    storageBucket: "sistema-de-inventario-3d3f4.firebasestorage.app",
    messagingSenderId: "1051163509471",
    appId: "1:1051163509471:web:04cd80caeb6d4b3e8bdf6a",
    measurementId: "G-MQ6KGDCETT"
};

// Inicialización de Firebase (evita reinicialización si ya está cargado)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Establecer persistencia de sesión
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("✅ Persistencia de sesión activada."))
    .catch((error) => console.error("❌ Error al establecer persistencia:", error));

console.log("✅ Firebase inicializado correctamente");