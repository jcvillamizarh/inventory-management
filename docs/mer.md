# Modelo Entidad-Relación (MER)

**Proyecto:** Sistema de Gestión de Inventario - Producción de Empanadas  
**Motor de Base de Datos:** PostgreSQL (Alojado en Supabase / Neon)  
**Estrategia de Datos:** Históricos inmutables diarios y catálogos relacionales.

---

## 1. Diagrama de Estructura Lógica

A continuación se detalla la relación y cardinalidad entre las entidades del sistema:

* **Users** (1) ---- (N) **Inventory_Entries** *(Auditabilidad de quién registra)*
* **Users** (1) ---- (N) **Daily_Closures** *(Auditabilidad de quién cierra jornada)*
* **Providers** (1) ---- (N) **Inventory_Entries** *(Trazabilidad de compras)*
* **Products** (1) ---- (N) **Inventory_Entries** *(Insumos que entran)*
* **Products** (1) ---- (N) **Daily_Closures** *(Insumos que se cuentan al final del día)*

---

## 2. Diccionario de Datos (Definición de Tablas)

### Tabla: `users`

Almacena las credenciales cifradas y los privilegios de acceso del personal.

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Identificador único global de la cuenta. |
| `username` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Nombre de usuario único para inicio de sesión. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Contraseña hasheada con Bcrypt (OWASP). |
| `role` | `VARCHAR(20)` | `NOT NULL` | Enum: `ADMINISTRADOR`, `CONSULTA`. |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Permite deshabilitar usuarios sin borrar su histórico. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Fecha de creación del registro. |

---

### Tabla: `providers`

Catálogo centralizado de proveedores administrado exclusivamente por el rol Administrador.

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | ID numérico autoincremental. |
| `nit_cedula` | `VARCHAR(20)` | `NULL`, `UNIQUE` | Documento de identificación fiscal o cédula. |
| `name` | `VARCHAR(100)` | `NOT NULL` | Razón social o nombre comercial. |
| `phone` | `VARCHAR(20)` | `NULL` | Teléfono de contacto. |
| `address` | `VARCHAR(200)` | `NULL` | Dirección física del proveedor. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Registro de auditoría temporal. |

---

### Tabla: `products`

Catálogo general de insumos y productos terminados del negocio.

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | ID numérico autoincremental. |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Nombre único (ej. "Harina de Trigo Haz de Oros"). |
| `category` | `VARCHAR(25)` | `NOT NULL` | Enum: `MATERIA_PRIMA`, `PRODUCTO_TERMINADO`, `MATERIAL_DE_EMPAQUE`, `PRODUCTOS_L_D`. |
| `type` | `VARCHAR(20)` | `NOT NULL` | Enum: `SECO_NO_PERECEDERO`, `PERECEDERO`. |
| `unit_base` | `VARCHAR(20)` | `NOT NULL` | Enum: `KILOGRAMOS`, `LITROS`, `UNIDADES`, `GRAMOS`, `MILILITROS`. |
| `stock_minimo` | `NUMERIC(10,2)`| `NULL` | Umbral de alerta. Obligatorio si type es SECO. |
| `presentation_quantity` | `NUMERIC(10,2)`| `NOT NULL` | Cantidad por unidad de presentación. |

* **Constraints Check:**
  * `CONSTRAINT chk_category CHECK (category IN ('MATERIA_PRIMA', 'PRODUCTO_TERMINADO', 'MATERIAL_DE_EMPAQUE', 'PRODUCTOS_L_D'))`
  * `CONSTRAINT chk_type CHECK (type IN ('SECO_NO_PERECEDERO', 'PERECEDERO'))`
  * `CONSTRAINT chk_unit CHECK (unit_base IN ('KILOGRAMOS', 'LITROS', 'UNIDADES', 'GRAMOS', 'MILILITROS'))`
  * `CONSTRAINT chk_stock_minimo CHECK ((type = 'SECO_NO_PERECEDERO' AND stock_minimo IS NOT NULL AND stock_minimo > 0) OR (type = 'PERECEDERO' AND stock_minimo IS NULL))`
  * `CONSTRAINT chk_presentation_quantity CHECK (presentation_quantity > 0)`

---

### Tabla: `inventory_entries` (Entradas de Inventario)

Registra cada lote de insumos que ingresa al negocio con control de lote y fecha de vencimiento.

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | ID único transaccional. |
| `provider_id` | `INT` | `FOREIGN KEY REFERENCES providers(id)` | Proveedor que despacha la mercancía. |
| `product_id` | `INT` | `FOREIGN KEY REFERENCES products(id)` | Producto que ingresa. |
| `user_id` | `UUID` | `FOREIGN KEY REFERENCES users(id)` | Operador/Admin que digita la entrada. |
| `entry_date` | `DATE` | `DEFAULT CURRENT_DATE` | Fecha contable de la transacción. |
| `expiration_date` | `DATE` | `NOT NULL` | Fecha de vencimiento del lote. |
| `batch_number` | `VARCHAR(50)` | `NOT NULL` | Número de lote del producto. |
| `quantity_units` | `NUMERIC(10,2)`| `NOT NULL` | Cantidad en unidades base. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Sello de tiempo del servidor. |

---

### Tabla: `daily_closures` (Reconteo Nocturno y Cierre)

Almacena el conteo físico de la noche y el consumo final calculado por el sistema al cierre de cada jornada.

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | ID único transaccional. |
| `product_id` | `INT` | `FOREIGN KEY REFERENCES products(id)` | Insumo evaluado. |
| `user_id` | `UUID` | `FOREIGN KEY REFERENCES users(id)` | Operador/Admin que realiza el conteo. |
| `closure_date` | `DATE` | `DEFAULT CURRENT_DATE` | Fecha operativa de la jornada que cierra. |
| `initial_stock` | `NUMERIC(10,2)`| `NOT NULL` | Inventario con el que arrancó el día. |
| `total_entries` | `NUMERIC(10,2)`| `DEFAULT 0.00` | Sumatoria de las entradas del día (RF03). |
| `physical_stock`| `NUMERIC(10,2)`| `NOT NULL` | Conteo físico digitado por el operador. |
| `calculated_consumption`| `NUMERIC(10,2)`| `NOT NULL` | Resultado final (`initial_stock` + `total_entries` - `physical_stock`). |

* **Constraint Unique compuesta:** `UNIQUE (product_id, closure_date)` *(Evita duplicar cierres para un mismo producto el mismo día).*

---

## 3. Scripts SQL de Inicialización (DDL)

```sql
-- Habilitar extensión para UUIDs en PostgreSQL si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    nit_cedula VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(25) NOT NULL,
    type VARCHAR(20) NOT NULL,
    unit_base VARCHAR(20) NOT NULL,
    stock_minimo NUMERIC(10,2),
    presentation_quantity NUMERIC(10,2) NOT NULL,
    CONSTRAINT chk_category CHECK (category IN ('MATERIA_PRIMA', 'PRODUCTO_TERMINADO', 'MATERIAL_DE_EMPAQUE', 'PRODUCTOS_L_D')),
    CONSTRAINT chk_type CHECK (type IN ('SECO_NO_PERECEDERO', 'PERECEDERO')),
    CONSTRAINT chk_unit CHECK (unit_base IN ('KILOGRAMOS', 'LITROS', 'UNIDADES', 'GRAMOS', 'MILILITROS')),
    CONSTRAINT chk_stock_minimo CHECK (
        (type = 'SECO_NO_PERECEDERO' AND stock_minimo IS NOT NULL AND stock_minimo > 0) OR
        (type = 'PERECEDERO' AND stock_minimo IS NULL)
    ),
    CONSTRAINT chk_presentation_quantity CHECK (presentation_quantity > 0)
);

CREATE TABLE inventory_entries (
    id BIGSERIAL PRIMARY KEY,
    provider_id INT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    entry_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    quantity_units NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_closures (
    id BIGSERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    closure_date DATE DEFAULT CURRENT_DATE,
    initial_stock NUMERIC(10,2) NOT NULL,
    total_entries NUMERIC(10,2) DEFAULT 0.00,
    physical_stock NUMERIC(10,2) NOT NULL,
    calculated_consumption NUMERIC(10,2) NOT NULL,
    UNIQUE (product_id, closure_date)
);
