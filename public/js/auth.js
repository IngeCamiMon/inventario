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

// Función para determinar la página de destino según el email del usuario
function getRedirectPageByEmail(email) {
    // Normalizar email (convertir a minúsculas)
    const normalizedEmail = email.toLowerCase();
    
    // Definir redirecciones por tipo de usuario
    switch(normalizedEmail) {
        case 'local52@tecnologyjc.com':
            return 'index.html';
        case 'laboratorio@tecnologyjc.com':
            return 'tecnico.html';
        case 'gamer@tecnologyjc.com':
            return 'gamer.html';
        case 'jalcuza_58@hotmail.com':
            return 'admin.html'; // Página especial para el administrador
        default:
            // Para cualquier otro email, redirigir a la página predeterminada
            return 'index.html';
    }
}

// Un solo listener de autenticación centralizado
export function setupAuthStateListener(callbacks) {
    onAuthStateChanged(auth, (user) => {
        console.log("🔹 Estado de autenticación:", user ? `Usuario: ${user.email}` : "No hay usuario");
        
        // Ejecutar callbacks específicos según la página
        if (user) {
            if (callbacks?.onLogin) callbacks.onLogin(user);
            
            // Redirigir según el email del usuario, solo cuando está en la página de login
            if (window.location.pathname.includes("login.html")) {
                const redirectPage = getRedirectPageByEmail(user.email);
                console.log(`🚀 Redirigiendo a usuario ${user.email} a ${redirectPage}`);
                window.location.href = redirectPage;
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
    
    // Manejar menú de navegación del administrador
    if (user && user.email && user.email.toLowerCase() === 'jalcuza_58@tecnologyjc.com') {
        createAdminMenu();
    } else {
        removeAdminMenu();
    }
}

// Alternar entre formularios
function toggleForms(type) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    
    if (loginForm) loginForm.style.display = type === "login" ? "block" : "none";
    if (registerForm) registerForm.style.display = type === "register" ? "block" : "none";
}

// Crear menú de navegación para el administrador
function createAdminMenu() {
    // Verificar si el menú ya existe
    if (document.getElementById('adminNavMenu')) return;
    
    // Crear el elemento de menú
    const adminMenu = document.createElement('div');
    adminMenu.id = 'adminNavMenu';
    adminMenu.style.position = 'fixed';
    adminMenu.style.top = '0';
    adminMenu.style.left = '0';
    adminMenu.style.width = '100%';
    adminMenu.style.backgroundColor = '#333';
    adminMenu.style.color = 'white';
    adminMenu.style.padding = '10px';
    adminMenu.style.textAlign = 'center';
    adminMenu.style.zIndex = '1000';
    
    // Crear los enlaces de navegación
    const pages = [
        { name: 'Inicio', url: 'index.html' },
        { name: 'Técnico', url: 'tecnico.html' },
        { name: 'Gamer', url: 'gamer.html' }
    ];
    
    // Agregar título
    const title = document.createElement('div');
    title.textContent = 'Panel de Administrador - Acceso a Todas las Vistas';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    adminMenu.appendChild(title);
    
    // Contenedor para los enlaces
    const linksContainer = document.createElement('div');
    
    // Agregar enlaces
    pages.forEach(page => {
        const link = document.createElement('a');
        link.href = page.url;
        link.textContent = page.name;
        link.style.color = 'white';
        link.style.textDecoration = 'none';
        link.style.margin = '0 15px';
        link.style.padding = '5px 10px';
        link.style.borderRadius = '3px';
        link.style.backgroundColor = '#555';
        
        linksContainer.appendChild(link);
    });
    
    adminMenu.appendChild(linksContainer);
    
    // Agregar el menú al cuerpo del documento
    document.body.insertBefore(adminMenu, document.body.firstChild);
    
    // Agregar espacio para que el contenido no quede debajo del menú
    const spacer = document.createElement('div');
    spacer.style.height = '80px';
    document.body.insertBefore(spacer, document.body.firstChild.nextSibling);
}

// Eliminar menú de administrador
function removeAdminMenu() {
    const adminMenu = document.getElementById('adminNavMenu');
    if (adminMenu) {
        adminMenu.remove();
        
        // Eliminar el espaciador si existe
        const spacer = document.querySelector('body > div:first-child + div');
        if (spacer && spacer.style.height === '80px') {
            spacer.remove();
        }
    }
}