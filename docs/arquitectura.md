# Documento de Arquitectura de Software (Módulos y Casos de Uso Decoupled)

**Proyecto:** Sistema de Gestión de Inventario - Producción de Empanadas  
**Paradigma:** Arquitectura Limpia (Desacoplada) Simplificada  
**Enfoque de Desarrollo:** Test-Driven Development (TDD)  

---

## 1. Stack Tecnológico Elegido

* **Framework Principal:** **Next.js** (App Router). Unifica la interfaz web y los endpoints del servidor (API Routes) en un único proyecto, desplegado de forma gratuita y serverless en **Vercel**.
* **Lenguaje:** **TypeScript**. Proporciona interfaces y contratos estrictos para asegurar el desacoplamiento de la base de datos y facilitar el refactor seguro en TDD.
* **Acceso a Base de Datos:** **Drizzle ORM + PostgreSQL**. Drizzle actúa como un mapeador ágil que traduce código TypeScript a SQL nativo. La lógica de persistencia se encapsula detrás de repositorios.
* **Validación de Datos:** **Zod**. Valida los formatos de entrada de los formularios en la API antes de activar los casos de uso.
* **Entorno de Pruebas (TDD):** **Vitest** (Motor de pruebas ultra veloz en Node.js) + **Playwright** para pruebas de flujo completo (E2E).

---

## 2. Patrones de Diseño para la Extensibilidad

### 2.1. Patrón Repositorio (Repository Pattern)

Cada módulo define una `interface` de TypeScript que lista las operaciones de datos que el negocio necesita (ej: `save()`, `findById()`). La lógica de las API Routes solo conoce la interfaz. La implementación real con Drizzle/PostgreSQL se desarrolla por separado. Si cambias de base de datos, el caso de uso permanece intacto.

### 2.2. Casos de Uso Únicos (Command Pattern / Use Cases)

Cada acción del usuario en el sistema se procesa mediante una clase o función única autocontenida (un archivo por acción). Esto evita archivos de servicio gigantescos ("God Classes") y permite mapear un archivo de prueba (`.test.ts`) por cada requerimiento del negocio.

### 2.3. Inyección de Dependencias Manual (Simple)

Para no complicar el proyecto con frameworks de inyección de dependencias, los Casos de Uso recibirán el repositorio como un parámetro en su constructor o función. En el código real le pasamos el repositorio de PostgreSQL; en los tests unitarios de TDD, le pasamos un repositorio falso (Mock) que guarda datos en un array de memoria.

---

## 3. Estructura de Carpetas Modular Desacoplada

El proyecto se organiza en **módulos independientes por contexto de negocio**. Dentro de cada módulo, la lógica se separa en tres elementos: Contrato (Interfaz), Operación (Caso de Uso) e Infraestructura (Persistencia).

```text
src/
├── app/                      # CAPA DE ENTREGA (Next.js App Router)
│   ├── page.tsx              # Pantalla de Login
│   ├── dashboard/            # Interfaces de Usuario (Admin, Consulta)
│   │   ├── page.tsx          # Dashboard principal
│   │   ├── closure/          # Cierre diario
│   │   ├── admin/            # Administración
│   │   └── reports/          # Reportes (Alertas, Inventario General)
│   └── api/                  # CONTROLADORES (API Routes - HTTP)
│       ├── auth/             # Autenticación
│       ├── inventory/        # Entradas y Cierres
│       ├── products/         # Catálogo de productos
│       ├── providers/        # Catálogo de proveedores
│       └── reports/          # Reportes de inventario
│
├── modules/                  # NÚCLEO DEL NEGOCIO MODULAR
│   ├── auth/                 # Módulo de Autenticación
│   │   ├── auth.repository.ts
│   │   ├── use-cases/
│   │   └── infrastructure/
│   │
│   ├── users/                # Módulo de Usuarios
│   │   ├── users.repository.ts
│   │   ├── use-cases/
│   │   └── infrastructure/
│   │
│   ├── products/             # Catálogo de Insumos y Productos
│   │   ├── products.repository.ts
│   │   ├── use-cases/
│   │   └── infrastructure/
│   │
│   ├── providers/            # Catálogo de Proveedores
│   │   ├── providers.repository.ts
│   │   ├── use-cases/
│   │   └── infrastructure/
│   │
│   ├── inventory/           # Módulo de Movimientos (Entradas y Cierres)
│   │   ├── inventory.repository.ts # CONTRATO: Interface de operaciones de datos
│   │   ├── use-cases/        # CASOS DE USO (Lógica Pura de Negocio)
│   │   │   ├── register-entry.ts    # Caso de Uso: Ingreso matutino
│   │   │   ├── process-closure.ts   # Caso de Uso: Balance y consumo nocturno
│   │   │   └── *.test.ts            # Pruebas unitarias TDD
│   │   └── infrastructure/   # INFRAESTRUCTURA (Acoplado a la tecnología actual)
│   │       ├── inventory.drizzle.ts # Implementación del Repositorio usando Drizzle
│   │       └── inventory.schema.ts  # Definición de tablas de PostgreSQL
│   │
│   └── reports/              # Módulo de Reportes
│       ├── reports.repository.ts
│       ├── use-cases/
│       │   ├── general-inventory-report.ts
│       │   └── stock-alerts.ts
│       └── infrastructure/
│           └── reports.drizzle.ts
│
└── lib/                      # Conexión base e inicialización de Drizzle
    ├── db/
    │   ├── index.ts         # Conexión a PostgreSQL
    │   └── schema.ts        # Esquema de base de datos
    └── utils/               # Utilidades comunes
