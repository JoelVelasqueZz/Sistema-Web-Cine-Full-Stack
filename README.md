# ParkyFilms - Sistema de Gestión Cinematográfica

Sistema completo de gestión cinematográfica con autenticación OAuth, reservas de boletos, administración de películas y sistema de recompensas.

## Stack Tecnológico

### Frontend
- **Angular 19.2.x** con TypeScript 5.7.2
- **RxJS** para programación reactiva con Observables
- **jsPDF** para generación de reportes PDF
- **Bootstrap/CSS3** para UI responsiva

### Backend
- **Node.js/Express.js** como servidor API REST
- **PostgreSQL** como base de datos principal
- **JWT** para autenticación de sesiones
- **OAuth 2.0** integrado con Google

### Infraestructura
- **Railway** para despliegue en producción
- **Nodemon** para desarrollo

## Requisitos del Sistema

- Node.js ≥ 18.0.0
- npm ≥ 8.0.0
- PostgreSQL ≥ 12.0
- Git

## Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/ParkyFilms.git
cd ParkyFilms
```

### 2. Configurar Frontend
```bash
# Instalar dependencias del frontend
npm install

# Iniciar servidor de desarrollo
npm run dev
```
El frontend estará disponible en `http://localhost:4200/`

### 3. Configurar Backend
```bash
# Cambiar al directorio del backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno (ver sección siguiente)
cp .env.example .env

# Ejecutar migraciones de base de datos
npm run migrate

# Iniciar servidor de desarrollo
npm run dev
```
El backend estará disponible en `http://localhost:3000/`

## Variables de Entorno

Crear archivo `.env` en el directorio `backend/`:

```env
# Base de Datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/parkyfilms

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura

# OAuth - Google
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Configuración del servidor
PORT=3000
NODE_ENV=development
```

## Scripts Disponibles

### Frontend
```bash
npm run dev          # Servidor de desarrollo (puerto 4200)
npm run build        # Build de producción
npm run build:prod   # Build optimizado para producción
npm start            # Servidor de producción
npm test             # Tests unitarios con Karma
npm run lint         # Linting del código
```

### Backend
```bash
npm run dev          # Servidor con nodemon (desarrollo)
npm start            # Servidor de producción
npm run migrate      # Ejecutar migraciones de BD
npm run seed         # Poblar BD con datos de prueba
npm test             # Tests unitarios con Jest
npm run test:watch   # Tests en modo watch
```

## Arquitectura del Sistema

```
┌─────────────────┐    HTTP/REST API    ┌──────────────────┐
│   Frontend SPA  │ ◄─────────────────► │   Backend API    │
│   (Angular)     │                     │   (Express.js)   │
└─────────────────┘                     └──────────────────┘
                                                   │
                                                   ▼
                                        ┌──────────────────┐
                                        │   PostgreSQL     │
                                        │   (Database)     │
                                        └──────────────────┘
```

### Componentes Principales:
- **Frontend SPA**: Angular con routing client-side y state management
- **API REST**: Express.js con middleware de autenticación JWT
- **Base de Datos**: PostgreSQL con migraciones y seeding
- **Autenticación**: OAuth 2.0 + JWT tokens para sesiones seguras
- **Despliegue**: Railway para producción con CI/CD

## Funcionalidades Principales

### Autenticación y Usuarios
- Registro e inicio de sesión tradicional
- OAuth con Google
- Gestión de perfiles de usuario
- Roles y permisos (Admin, Usuario)

### Gestión de Películas
- Catálogo completo de películas
- Búsqueda y filtros avanzados
- Gestión de horarios y funciones
- Upload de posters e imágenes

###  Sistema de Reservas
- Reserva de boletos en tiempo real
- Selección de asientos interactiva
- Confirmación por email
- Historial de reservas

### Sistema de Recompensas
- Puntos por compras y actividades
- Niveles de membresía
- Descuentos y promociones
- Dashboard de recompensas

### Reportes y Analytics
- Generación de reportes PDF
- Estadísticas de ventas
- Analytics de usuarios
- Dashboards administrativos

## Despliegue

### Desarrollo Local
1. Seguir los pasos de instalación
2. Configurar variables de entorno
3. Ejecutar `npm run dev` en ambos directorios

### Producción
El proyecto está configurado para despliegue en **Railway**:

```bash
# Build de producción
npm run build:prod

# El despliegue se realiza automáticamente via GitHub Actions
```

## Estructura del Proyecto

```
ParkyFilms/
├── src/                    # Código fuente del frontend
│   ├── app/               # Componentes Angular
│   ├── assets/            # Recursos estáticos
│   └── environments/      # Configuraciones de entorno
├── backend/               # Servidor Express.js
│   ├── controllers/       # Controladores de la API
│   ├── models/           # Modelos de base de datos
│   ├── routes/           # Definición de rutas
│   ├── middleware/       # Middleware personalizado
│   └── migrations/       # Migraciones de BD
├── docs/                 # Documentación
└── README.md            # Este archivo
```

## Testing

### Frontend
```bash
npm test                 # Tests unitarios
npm run test:coverage    # Tests con coverage
npm run e2e             # Tests end-to-end
```

### Backend
```bash
npm test                 # Tests con Jest
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Coverage completo
```

⭐ Si este proyecto te resulta útil, ¡no olvides darle una estrella en GitHub!
