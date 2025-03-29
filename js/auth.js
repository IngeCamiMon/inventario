// auth.js - Manejo de autenticación centralizado
import { auth } from "./config.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

console.log("✅ auth.js cargado correctamente");

// Exportar funciones para ser usadas en otros módulos
export function initAuthListeners() {
    // Solo configurar los listeners una vez
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const logoutBtn = document.getElementById("logoutBtn");
    const showRegister = document.getElementById("showRegister");
    const showLogin = document.getElementById("showLogin");

    loginForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        handleLogin();
    });

    registerForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        handleRegister();
    });

    logoutBtn?.addEventListener("click", (event) => {
        event.preventDefault();
        handleLogout();
    });

    showRegister?.addEventListener("click", () => toggleForms("register"));
    showLogin?.addEventListener("click", () => toggleForms("login"));
}

// Un solo listener de autenticación centralizado
export function setupAuthStateListener(callbacks) {
    onAuthStateChanged(auth, (user) => {
        console.log("🔹 Estado de autenticación:", user ? `Usuario: ${user.email}` : "No hay usuario");
        
        // Ejecutar callbacks específicos según la página
        if (user) {
            if (callbacks?.onLogin) callbacks.onLogin(user);
            // Redirigir según sea necesario
            if (window.location.pathname.includes("login.html")) {
                window.location.href = "index.html";
            }
        } else {
            if (callbacks?.onLogout) callbacks.onLogout();
            // Redirigir según sea necesario
            if (!window.location.pathname.includes("login.html")) {
                window.location.href = "login.html";
            }
        }
        
        // Actualizar UI según corresponda
        updateAuthUI(user);
    });
}

// Funciones específicas de autenticación
function handleRegister() {
    const email = document.getElementById("registerEmail")?.value.trim();
    const password = document.getElementById("registerPassword")?.value.trim();

    if (!email || !password) {
        alert("⚠️ Por favor, ingrese un correo y una contraseña.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("✅ Usuario registrado:", userCredential.user);
            // Eliminamos el alert para evitar que interrumpa la redirección
            // La redirección será manejada por onAuthStateChanged
        })
        .catch((error) => {
            console.error("❌ Error en registro:", error);
            alert("Error en registro: " + error.message);
        });
}

function handleLogin() {
    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value.trim();

    if (!email || !password) {
        alert("⚠️ Por favor, ingrese un correo y una contraseña.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("✅ Usuario autenticado:", userCredential.user);
            // Eliminamos el alert para evitar que interrumpa la redirección
            // La redirección será manejada por onAuthStateChanged
        })
        .catch((error) => {
            console.error("❌ Error en inicio de sesión:", error);
            alert("Error en inicio de sesión: " + error.message);
        });
}

export async function handleLogout() {
    try {
        await signOut(auth);
        console.log("✅ Sesión cerrada");
        // Eliminamos el alert para evitar que interrumpa la redirección
        // La redirección será manejada por onAuthStateChanged
    } catch (error) {
        console.error("❌ Error al cerrar sesión:", error);
        alert("Error al cerrar sesión: " + error.message);
    }
}

// Actualizar UI según estado de autenticación
function updateAuthUI(user) {
    // Elementos en página de login
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    
    // Elementos en página de inventario
    const logoutBtn = document.getElementById("logoutBtn");
    const userEmailDisplay = document.getElementById("userEmail");
    const inventorySection = document.getElementById("inventorySection");
    
    // Actualizar elementos si existen
    if (loginForm) loginForm.style.display = user ? "none" : "block";
    if (registerForm) registerForm.style.display = user ? "none" : "none";
    if (logoutBtn) logoutBtn.style.display = user ? "block" : "none";
    if (userEmailDisplay && user) userEmailDisplay.textContent = `Bienvenido, ${user.email}`;
    if (inventorySection) inventorySection.style.display = user ? "block" : "none";
}

// Alternar entre formularios
function toggleForms(type) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    
    if (loginForm) loginForm.style.display = type === "login" ? "block" : "none";
    if (registerForm) registerForm.style.display = type === "register" ? "block" : "none";
}