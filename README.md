# Sistema de Gestión de Inventario - Majaka 🥟

Sistema full-stack de gestión de inventario desarrollado bajo la metodología **Test-Driven Development (TDD)** y principios de **Arquitectura Desacoplada**. Diseñado específicamente con un enfoque *Mobile-First* para optimizar el control de materias primas, insumos y productos terminados directamente desde dispositivos móviles en el entorno de producción (cocina).

---

## 🚀 Características Principales

* **Desacoplamiento Garantizado:** Implementación del *Patrón Repositorio* y *Casos de Uso* únicos, aislando por completo la lógica de negocio del motor de base de datos.
* **Cálculo Preciso de Stock:** Algoritmo optimizado que calcula el stock actual basándose en cierres diarios y entradas posteriores, evitando duplicaciones y errores.
* **Alertas de Stock:** Sistema automático de alertas para productos no perecederos que caen por debajo del stock mínimo configurado.
* **Control de Acceso por Roles:** Gestión de roles (`ADMINISTRADOR`, `CONSULTA`) con redirección inteligente y restricción de acceso a secciones sensibles.
* **Seguridad:** Cifrado criptográfico robusto con `bcryptjs` bajo estándares OWASP para la persistencia de contraseñas.
* **Optimización de Rendimiento:** Consultas batch optimizadas para evitar problemas N+1 en reportes de inventario.
* **Calidad de Código:** Suite de pruebas automatizadas que validan cada regla de negocio.

---

## 🛠️ Stack Tecnológico

* **Framework:** Next.js (App Router)
* **Lenguaje:** TypeScript
* **Base de Datos:** PostgreSQL
* **ORM:** Drizzle ORM
* **Validación:** Zod
* **Pruebas:** Vitest
* **Estilos:** TailwindCSS
* **Despliegue:** Vercel

---

## 💻 Cómo Correr el Proyecto Localmente

### 1. Prerrequisitos
Asegúrate de tener instalado en tu máquina:
* [Node.js](https://nodejs.org/) (Versión 18 o superior)
* Una instancia local o remota de **PostgreSQL** (puedes usar un proyecto gratuito en Supabase o Neon).

### 2. Clonar e Instalar Dependencias
Clona este repositorio en tu máquina local y accede a la carpeta del proyecto:
```bash
git clone <url-de-tu-repositorio>
cd inventory-management
npm install
```

### 3. Configurar Base de Datos
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tu configuración de PostgreSQL:
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/tu_base_de_datos
```

### 4. Ejecutar Migraciones
Genera y aplica las migraciones de la base de datos:
```bash
npm run db:generate
npm run db:migrate
```

### 5. Correr el Servidor de Desarrollo
Inicia el servidor de desarrollo de Next.js:
```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

### 6. Ejecutar Tests
Para ejecutar la suite de pruebas:
```bash
npm test
```

---

## 📱 Uso de la Aplicación

### Roles de Usuario
* **ADMINISTRADOR:** Acceso completo a todas las funcionalidades (registro de entradas, cierre diario, administración, reportes).
* **CONSULTA:** Acceso restringido únicamente a la sección de reportes, sin capacidad de modificar inventario.

### Funcionalidades
1. **Login:** Accede a `http://localhost:3000` e inicia sesión con tus credenciales
2. **Dashboard:** Según tu rol, serás redirigido al panel correspondiente
3. **Registro de Entradas:** Registra las entradas de inventario de la mañana
4. **Cierre Diario:** Procesa el cierre diario con balance de masa y stock físico actual
5. **Reportes:**
   - **Alertas de Stock:** Visualiza productos con stock bajo el mínimo configurado
   - **Inventario General:** Consulta el stock actual de todos los productos con cálculo de medida total

---

## 🧪 Testing

El proyecto cuenta con pruebas automatizadas que cubren:
- Casos de uso de negocio
- Integración de API routes
- Control de acceso por roles

Ejecuta las pruebas en modo watch para desarrollo:
```bash
npm test
```

---

## 🚀 Despliegue en Producción

El proyecto está configurado para despliegue en Vercel. Para desplegar:

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno en Vercel (`DATABASE_URL`)
3. Vercel detectará automáticamente que es un proyecto Next.js y lo desplegará

### Variables de Entorno Requeridas
* `DATABASE_URL`: URL de conexión a PostgreSQL

---

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Login page
├── modules/               # Domain modules
│   ├── inventory/         # Inventory domain
│   ├── products/          # Products domain
│   ├── providers/         # Providers domain
│   └── reports/           # Reports domain
└── lib/                   # Utilities and database config
```
