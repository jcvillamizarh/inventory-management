# Especificación de Requisitos de la Aplicación (ERA)

**Proyecto:** Sistema de Gestión de Inventario - Producción de Empanadas  
**Enfoque de Desarrollo:** Test-Driven Development (TDD)  
**Arquitectura:** Full-Stack Serverless (Next.js + PostgreSQL)

---

## 1. Introducción y Alcance

Este documento detalla los requisitos funcionales y no funcionales para el Sistema de Gestión de Inventario. El software tiene como objetivo automatizar el control físico y financiero de las materias primas y productos terminados de la empresa, reemplazando los registros manuales por un sistema de balance diario basado en rendimiento y stock real.

---

## 2. Requisitos Funcionales (RF) y Casuísticas para TDD

### RF01: Módulo Administrativo - Catálogo de Insumos y Productos

El sistema debe permitir al Administrador gestionar los elementos del inventario bajo una parametrización estricta para evitar inconsistencias en las etapas operativas.

*   **Campos Obligatorios del Formulario (Inputs):**
    *   `Nombre del Producto`: Texto (Único, ej. "Harina de Trigo Haz de Oros").
    *   `Categoría`: Lista desplegable con opciones fijas: `Materia Prima` o `Producto Terminado`.
    *   `Tipo de Producto`: Lista desplegable con opciones fijas: `Seco / No Perecedero` o `Perecedero`.
    *   `Unidad de Medida Base`: Lista desplegable: `Kilogramos`, `Litros`, `Unidades`.
    *   `Stock Mínimo (Umbral)`: Número decimal positivo. *Nota: Solo se exige y procesa si el tipo es `Seco / No Perecedero`*.
*   **Reglas de Negocio:**
    *   Si el producto se registra como `Perecedero` (ej. Carne de res), el campo `Stock Mínimo` se desactiva en la interfaz y el backend lo almacena forzosamente como `null`.
*   **Casuísticas de Prueba (TDD):**
    *   *Test 1 (Éxito - Secos):* `POST /api/products` con datos válidos de producto seco. **Resultado esperado:** Código 201 (Created), el objeto guardado en base de datos incluye el umbral numérico.
    *   *Test 2 (Éxito - Perecederos):* `POST /api/products` con producto perecedero y sin umbral. **Resultado esperado:** Código 201 (Created), el registro almacena `stock_minimo: null`.
    *   *Test 3 (Fallo - Validación):* `POST /api/products` enviando un `Stock Mínimo` negativo o vacío en un producto tipo `Seco`. **Resultado esperado:** Código 400 (Bad Request).
    *   *Test 4 (Fallo - Duplicidad):* `POST /api/products` con un nombre del producto ya existente. **Resultado esperado:** Código 409 (Conflict).

---

### RF02: Módulo Administrativo - Gestión de Proveedores

Permite al Administrador pre-configurar un catálogo centralizado de proveedores autorizados para alimentar el flujo de compras.

*   **Campos Obligatorios del Formulario (Inputs):**
    *   `NIT / Cédula`: Texto (Clave única, ej. "900.123.456-1").
    *   `Razón Social / Nombre`: Texto (ej. "Distribuidora de Carnes El Triunfo").
    *   `Teléfono de Contacto`: Texto.
*   **Casuísticas de Prueba (TDD):**
    *   *Test 1 (Éxito):* `POST /api/providers` con NIT único y datos válidos. **Resultado esperado:** Código 201 (Created).
    *   *Test 2 (Fallo - Duplicidad):* `POST /api/providers` usando un NIT previamente registrado. **Resultado esperado:** Código 409 (Conflict).

---

### RF03: Módulo Operativo - Registro de Entradas (Mañana)

Pantalla responsiva donde el Operador registra de forma flexible los suministros recibidos al inicio de la jornada.

*   **Campos Obligatorios del Formulario (Inputs):**
    *   `Proveedor`: Lista desplegable (ID numérico del proveedor, RF02).
    *   `Producto`: Lista desplegable (Filtrado solo para ítems de categoría `Materia Prima`, RF01).
    *   `Cantidad de Empaques`: Número entero positivo (ej. 9).
    *   `Contenido / Presentación por Empaque`: Número decimal positivo (ej. 1.5).
    *   `Costo Neto Total de la Compra`: Número decimal positivo (Valor monetario total de la factura para ese lote).
*   **Lógica de Procesamiento Backend (API Route):**
    *   El backend intercepta el JSON y calcula de forma automática el total neto a ingresar: Cantidad de Empaques x Contenido = Total Unidades Base.
    *   Afecta el inventario agregando el valor calculado directamente al stock físico disponible del producto.
*   **Casuísticas de Prueba (TDD):**
    *   *Test 1 (Éxito - Conversión Dinámica):* `POST /api/inventory/entries` con `cantidad: 10`, `presentacion: 2.5` (Unidad Base: Kilogramos). **Resultado esperado:** Código 201, la base de datos debe almacenar exactamente `25.0` kilogramos en el lote ingresado.
    *   *Test 2 (Fallo - Datos Inválidos):* `POST /api/inventory/entries` con `costo: -15000` o `cantidad: 0`. **Resultado esperado:** Código 400 (Bad Request).

---

### RF04: Módulo Operativo - Reconteo Nocturno y Cierre de Jornada

Formulario dinámico donde el Operador registra las existencias físicas finales en neveras o bodegas al término del día laboral.

*   **Campos Obligatorios del Formulario (Inputs):**
    *   `Fecha del Conteo`: Fecha (Por defecto, la fecha actual del servidor).
    *   `Cantidad Física Existente`: Entrada numérica decimal por cada producto activo en la pantalla (digitado en la Unidad de Medida Base).
*   **Lógica de Procesamiento Backend (Fórmula de Consumo):**
    *   Para cada ítem, el backend ejecuta la ecuación de balance de masa: Inventario Inicial + Entradas del Día - Cantidad Física Existente = Consumo Real Diario.
    *   El valor resultante se guarda en la tabla de históricos de consumo. El valor de `Cantidad Física Existente` se convierte de forma automática en el `Inventario Inicial` del día siguiente.
*   **Casuísticas de Prueba (TDD):**
    *   *Test 1 (Éxito - Balance Estándar):* Inventario inicial = 10kg, Entradas del día = 90kg. El operador reporta un reconteo nocturno de 12kg. `POST /api/inventory/closure`. **Resultado esperado:** Código 200, almacenamiento de un consumo diario exacto de `88.0` kg.
    *   *Test 2 (Fallo - Inconsistencia Matemática):* Inventario inicial = 10kg, Entradas del día = 40kg (Total disponible = 50kg). El operador reporta por error un reconteo nocturno de 60kg. **Resultado esperado:** Código 422 (Unprocessable Entity), rechazo de la transacción por inconsistencia lógica (el stock remanente no puede superar al disponible).

---

### RF05: Módulo Administrativo - Reportes, Alertas e Históricos

Módulo de inteligencia de negocio con acceso exclusivo para el Administrador para la auditoría física, financiera y corrección de datos.

*   **Submódulo A: Panel de Alertas de Stock**
    *   **Lógica:** El endpoint escanea los productos tipo `Seco / No Perecedero`. Si el inventario actual es menor o igual al `Stock Mínimo` (RF01), cambia una bandera interna (`needsRestock: true`).
    *   *Test TDD:* `GET /api/reports/alerts`. **Resultado esperado:** Código 200, lista únicamente los productos secos que violaron el umbral. Los productos perecederos no deben aparecer bajo ninguna circunstancia.
*   **Submódulo B: Corrección de Históricos (Edición en Cadena)**
    *   **Lógica:** Al modificar el conteo físico o entrada de una fecha pasada, el backend recalcula el consumo de ese día y propaga de forma automática la corrección actualizando el `Inventario Inicial` de los días subsiguientes.
    *   *Test TDD:* `PUT /api/inventory/history/{id_registro}` modificando datos. **Resultado esperado:** Código 200, verificación en cascada de que el inventario inicial del día posterior se corrigió matemáticamente.
*   **Submódulo C: Reporte de Consumo y Costos**
    *   **Filtros:** Rango de fechas, Categoría y Proveedor.
    *   *Test TDD:* `GET /api/reports/financial?start=2026-01-01&end=2026-01-31`. **Resultado esperado:** Código 200, un arreglo de objetos que consolida cantidades, costos netos e inversión total por insumo.

---

### RF06: Módulo de Consulta (Vista de Solo Lectura)

Garantiza un entorno informativo seguro para supervisores, restringiendo cualquier acción de escritura en la base de datos.

*   **Comportamiento de la UI:** Las opciones de formularios de ingreso (RF03) y cierre (RF04) desaparecen del menú. Los botones de acción de guardar o modificar se deshabilitan.
*   **Casuísticas de Prueba (TDD):**
    *   *Test 1 (Éxito - Visualización):* Usuario con rol 'Consulta' realiza `GET /api/inventory/status`. **Resultado esperado:** Código 200 (OK) con la información actual del stock.
    *   *Test 2 (Fallo - Bloqueo de Escritura):* Usuario con rol 'Consulta' intenta saltarse la UI y envía un `POST /api/inventory/entries`. **Resultado esperado:** El middleware de la API retorna de forma inmediata un código 403 (Forbidden), bloqueando la inserción.

---

### RF07: Módulo de Gestión de Usuarios y Autenticación

Permite al Administrador centralizar el control de las credenciales de acceso a la plataforma.

*   **Campos Obligatorios (Inputs):** `Username` (Texto único), `Password` (Texto plano), `Rol` (Opciones: `Operador`, `Consulta`, `Administrador`).
*   **Casuísticas de Prueba (TDD):**
    *   *Test 1 (Acceso Restringido):* Un rol no-administrador intenta consultar `GET /api/users`. **Resultado esperado:** Código 403 (Forbidden).

---

## 3. Requisitos No Funcionales (RNF)

### RNF01: Stack Tecnológico y Arquitectura

*   **Frontend y Backend:** Framework Full-Stack **Next.js** (Ecosistema React para los componentes visuales y API Routes corriendo bajo Node.js para las funciones de backend y controladores).
*   **Base de Datos:** Motor relacional **PostgreSQL** hospedado en servicios en la nube (**Supabase** o **Neon**).

### RNF02: Infraestructura y Despliegue (Cero Costos)

*   La aplicación completa se desplegará en la infraestructura de **Vercel** bajo un modelo de arquitectura *serverless*, asegurando una URL pública cifrada (HTTPS) y eliminando costos de servidores activos 24/7. El sistema responderá de forma inmediata ante eventos y peticiones web sin tiempos de espera por inactividad.

### RNF03: Usabilidad y Diseño Responsivo

*   La UI se diseñará bajo la metodología *Mobile-First*. Las interfaces del Operador (RF03 y RF04) deben ser 100% fluidas, con botones e inputs amplios adaptados para el uso rápido desde celulares o tablets dentro del entorno de la cocina.

### RNF04: Seguridad y Cifrado (Estándar OWASP)

*   **Cifrado de Contraseñas:** En cumplimiento estricto con el estándar de control de fallos criptográficos de OWASP, las contraseñas jamás se guardarán en texto plano ni hashes simples. Se procesarán en el servidor aplicando funciones de hash robustas utilizando el algoritmo **bcrypt** con un factor de costo (*work factor*) mínimo de 10.
*   **Autorización:** Cada API Route validará la sesión o el token JWT del cliente, verificando el rol correspondiente antes de interactuar con la base de datos PostgreSQL.