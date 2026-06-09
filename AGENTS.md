# Agent Development Guidelines (Windsurf Instructions)

**Proyecto:** Sistema de Gestión de Inventario - Producción de Empanadas  
**Propósito:** Este archivo contiene las reglas e instrucciones obligatorias para el agente de IA (Windsurf) durante toda la fase de desarrollo. Su cumplimiento es estricto.

---

## 1. Principio Fundamental: TDD Obligatorio (Ciclo Red-Green-Refactor)

El desarrollo de cada funcionalidad, API Route o Caso de Uso debe seguir estrictamente la metodología de **Desarrollo Guiado por Pruebas (TDD)**. No se permite escribir código de producción sin su respectiva prueba previa.

El agente debe ejecutar el desarrollo en tres pasos indivisibles:

1. **FASE ROJA (Red):** * Escribir primero la prueba unitaria o de integración en el archivo `.test.ts` correspondiente al módulo.
   * Ejecutar la prueba usando **Vitest** y verificar textualmente que la prueba **falle** por los motivos correctos (ej: la función no existe o no retorna el valor esperado).
2. **FASE VERDE (Green):**
   * Escribir el código de producción mínimo y necesario (en el Caso de Uso o Acción) para lograr que la prueba que acaba de fallar **pase exitosamente**.
   * Ejecutar la suite de pruebas para confirmar el estado verde.
3. **REFACTORIZACIÓN (Refactor):**
    * Limpiar el código implementado, eliminar duplicidades, mejorar nombres de variables y asegurar las buenas prácticas sin alterar el comportamiento que ya hace pasar la prueba.

---

## 2. Alineación con la Documentación Existente

Antes de iniciar cualquier tarea o responder a un comando de desarrollo, el agente tiene la obligación de leer y alinearse con los siguientes artefactos ubicados en `docs/`:

* **`docs/era.md` (Requisitos y Casuísticas):** Define los inputs exactos de los formularios, las reglas de negocio (fórmula de balance de masa, restricciones de perecederos) y los códigos de estado HTTP esperados para los tests de aceptación.
* **`docs/MER.md` (Base de Datos):** Define la estructura de las tablas de PostgreSQL, restricciones (`CHECK`, `UNIQUE`) y tipos de datos que deben ser modelados con Drizzle ORM.
* **`docs/arquitectura.md` (Estructura y Patrones):** Define el flujo de desacoplamiento. La lógica de negocio **nunca** debe acoplarse a Drizzle ni a la base de datos; debe depender de las interfaces de `inventory.repository.ts`.

---

## 3. Reglas Técnicas y Buenas Prácticas para la IA

* **Desacoplamiento Estricto:** Al crear un Caso de Uso, este debe recibir el repositorio como interfaz en su constructor. Está prohibido importar directamente la instancia de la base de datos (`db`) de Drizzle dentro de un Caso de Uso.
* **Fail-Fast (Validación con Zod):** Cada payload HTTP entrante debe ser parseado inmediatamente por un esquema de Zod en la capa de la API Route. Si falla, debe retornar instantáneamente un código 400.
* **Simplicidad (KISS):** Mantener las funciones pequeñas, legibles y enfocadas en una sola responsabilidad. Evitar patrones Java pesados de sobre-ingeniería; utilizar la potencia de los tipos dinámicos y la estructuración nativa de TypeScript.
* **Manejo Criptográfico Seguro (OWASP):** Toda persistencia de contraseñas de usuarios debe pasar obligatoriamente por la utilidad de hash de `bcryptjs` con un factor de costo de 10. No se permiten comparaciones ni almacenamientos en texto plano.

---

## 4. Comandos Útiles para el Agente

* Ejecutar pruebas en tiempo real (Modo Watch): `npm run test` o `npx vitest`
* Ejecutar una prueba específica: `npx vitest src/modules/inventory/use-cases/process-closure.test.ts`
* Generar migraciones de base de datos (Drizzle): `npm run db:generate`
