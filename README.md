# Sistema de Inventario con Firebase

## Requisitos Previos
- Navegador web moderno
- Cuenta en Firebase
- Conexión a Internet

## Configuración

1. Crea un nuevo proyecto en Firebase:
   - Ir a [Firebase Console](https://console.firebase.google.com/)
   - Crear nuevo proyecto
   - Ir a Firestore Database
   - Crear base de datos en modo de prueba

2. Configurar credenciales:
   - En configuración del proyecto, genera una nueva configuración web
   - Copia las credenciales en `js/config.js`

## Características
- Agregar productos
- Editar productos
- Eliminar productos
- Búsqueda de productos
- Persistencia con Firebase Firestore

## Estructura del Proyecto
- `index.html`: Interfaz principal
- `css/styles.css`: Estilos de la aplicación
- `js/config.js`: Configuración de Firebase
- `js/database.js`: Servicios de base de datos
- `js/product.js`: Modelo de producto
- `js/app.js`: Lógica principal de la aplicación

## Próximas Mejoras
- Autenticación de usuarios
- Reportes de inventario
- Exportación de datos# inventario /c/Users/camil
