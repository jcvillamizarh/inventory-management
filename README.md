# Sistema de Gestión de Inventario - Producción de Empanadas 🥟

Este es un sistema full-stack desarrollado bajo la metodología **Test-Driven Development (TDD)** y principios de **Arquitectura Desacoplada**. Diseñado específicamente con un enfoque *Mobile-First* para optimizar el control de materias primas, insumos y productos terminados directamente desde dispositivos móviles en el entorno de producción (cocina).

---

## 🚀 Características Principales

* **Desacoplamiento Garantizado:** Implementación del *Patrón Repositorio* y *Casos de Uso* únicos, aislando por completo la lógica de negocio del motor de base de datos.
* **Robustez Matemática:** Control automatizado del balance diario de masa y consumos, bloqueando inconsistencias antes de impactar el inventario físico.
* **Seguridad:** Control de acceso basado en roles (`ADMINISTRADOR`, `OPERADOR`, `CONSULTA`) y cifrado criptográfico robusto con `bcryptjs` bajo estándares OWASP.
* **Calidad de Código:** Suite de 54 pruebas unitarias e de integración automatizadas que validan cada regla de negocio en milisegundos.

---

## 🛠️ Stack Tecnológico

* **Framework:** Next.js (App Router)
* **Lenguaje:** TypeScript
* **Base de Datos:** PostgreSQL
* **ORM:** Drizzle ORM
* **Validación:** Zod
* **Pruebas:** Vitest

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

1. **Login:** Accede a `http://localhost:3000` e inicia sesión con tus credenciales
2. **Dashboard:** Según tu rol, serás redirigido al panel correspondiente
3. **Registro de Entradas:** Registra las entradas de inventario de la mañana
4. **Cierre Diario:** Procesa el cierre diario con balance de masa
5. **Reportes:** Consulta alertas de stock y reportes financieros

---

## 🧪 Testing

El proyecto cuenta con 54 pruebas automatizadas que cubren:
- Casos de uso de negocio
- Integración de API routes
- Control de acceso por roles

Ejecuta las pruebas en modo watch para desarrollo:
```bash
npm test
```
