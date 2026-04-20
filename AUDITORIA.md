## Hallazgo 1 — No hay manejo centralizado de errores internos
- **Severidad:** media
- **Archivo/línea:** `index.js`, líneas 64-227
- **Descripción:** Las rutas no usan `try/catch` ni existe un middleware de errores para responder `500` cuando falle una operación inesperada.
- **Evidencia:** Todas las rutas están definidas con lógica directa sobre arreglos y al final solo existe un middleware `404` en las líneas 219-223.
- **Impacto:** Si ocurre una excepción en tiempo de ejecución, Express puede devolver respuestas inconsistentes o exponer trazas no controladas.

## Hallazgo 2 — Conflictos de unicidad responden `400` en vez de `409`
- **Severidad:** media
- **Archivo/línea:** `index.js`, líneas 79-83
- **Descripción:** Cuando el código del estudiante ya existe, la API devuelve `400 Bad Request` en lugar de `409 Conflict`.
- **Evidencia:** La condición de duplicado usa `res.status(400)` aunque se trata de una colisión con un recurso existente.
- **Impacto:** Los clientes no pueden distinguir claramente entre un payload inválido y un conflicto de negocio por duplicidad.

## Hallazgo 3 — Duplicados de asistencia también responden `400` en vez de `409`
- **Severidad:** media
- **Archivo/línea:** `index.js`, líneas 158-165
- **Descripción:** La regla que impide registrar dos asistencias para el mismo estudiante y fecha está implementada, pero la respuesta HTTP vuelve a ser `400` en lugar de `409`.
- **Evidencia:** La verificación `asistenciaExistente` responde con `res.status(400)`.
- **Impacto:** Se pierde semántica HTTP y se complica el manejo correcto de errores desde frontend o integraciones.

## Hallazgo 4 — Exposición de datos personales sin autenticación
- **Severidad:** alta
- **Archivo/línea:** `index.js`, líneas 99-113 y 180-195
- **Descripción:** Los endpoints públicos permiten listar estudiantes y consultar un estudiante por ID incluyendo el campo `correo`, sin autenticación ni autorización.
- **Evidencia:** `GET /api/estudiantes`, `GET /api/estudiantes/:id` y `GET /api/asistencias/estudiante/:id` retornan directamente objetos de estudiante con `correo`.
- **Impacto:** Cualquier consumidor con acceso a la API puede enumerar estudiantes y extraer datos personales.

## Hallazgo 5 — No hay controles mínimos de seguridad HTTP
- **Severidad:** media
- **Archivo/línea:** `index.js`, líneas 1-6
- **Descripción:** La API no configura `cors`, `helmet`, rate limiting ni ninguna protección básica para exposición pública.
- **Evidencia:** Solo se importa `express` y únicamente se registra `express.json()` como middleware.
- **Impacto:** El servicio queda más expuesto a abuso de endpoints, consumo automatizado y políticas de acceso poco claras si se publica fuera de local.

## Hallazgo 6 — No hay separación de capas; toda la lógica está en un solo archivo
- **Severidad:** media
- **Archivo/línea:** `index.js`, líneas 1-227
- **Descripción:** Rutas, validaciones, reglas de negocio, almacenamiento en memoria y arranque del servidor están mezclados en un mismo archivo.
- **Evidencia:** No existen carpetas de rutas, controladores ni servicios; todo el comportamiento de la API vive en `index.js`.
- **Impacto:** La mantenibilidad cae rápido al crecer el proyecto y resulta más difícil probar, extender o refactorizar la aplicación.

## Hallazgo 7 — No hay pruebas automatizadas
- **Severidad:** media
- **Archivo/línea:** `package.json`, líneas 6-8
- **Descripción:** El proyecto no incluye script de `test` ni archivos de pruebas para validar endpoints o reglas de negocio.
- **Evidencia:** En `scripts` solo aparece `start`, y en el repositorio no hay archivos de prueba.
- **Impacto:** Cualquier cambio futuro puede romper validaciones o respuestas sin detección temprana.

## Hallazgo 8 — README vacío y sin instrucciones de uso
- **Severidad:** baja
- **Archivo/línea:** `README.md`, línea 1
- **Descripción:** La documentación principal del repositorio está vacía.
- **Evidencia:** `README.md` existe pero no contiene pasos de instalación, ejecución, endpoints ni ejemplos.
- **Impacto:** Otra persona no puede levantar ni consumir la API solo con la documentación del repo.

## Hallazgo 9 — Configuración incompleta para entornos
- **Severidad:** baja
- **Archivo/línea:** `index.js`, línea 4
- **Descripción:** El puerto usa `process.env.PORT || 3000`, pero el repositorio no incluye `.env.example` ni documentación de variables de entorno.
- **Evidencia:** La única variable configurable detectada es `PORT`; no existe archivo de ejemplo para configuración local.
- **Impacto:** La configuración es mínima y poco visible para quien despliegue o integre la aplicación en otro entorno.

## Hallazgo 10 — Revisión de dependencias incompleta en el repositorio
- **Severidad:** baja
- **Archivo/línea:** `package.json`, líneas 9-10
- **Descripción:** El proyecto solo declara `express`, lo cual es suficiente para la API actual, pero no deja evidencia de revisión de vulnerabilidades ni política de actualización.
- **Evidencia:** Se detecta una sola dependencia declarada y no fue posible ejecutar `npm audit` en este entorno porque `npm` no está disponible en `PATH`.
- **Impacto:** No hay confirmación verificable de que las dependencias estén libres de vulnerabilidades conocidas al momento de esta auditoría.

## Hallazgo 11 — Falta minimización de datos personales
- **Severidad:** media
- **Archivo/línea:** `index.js`, líneas 86-91 y 192-194
- **Descripción:** El sistema almacena y devuelve `correo` aunque el requerimiento funcional no exige ese dato para registrar asistencia.
- **Evidencia:** El campo `correo` se persiste al crear estudiantes y luego se expone en respuestas de lectura.
- **Impacto:** Se incrementa la superficie de datos personales tratada por la API sin una necesidad funcional clara.

## Hallazgo 12 — Validaciones funcionales clave sí están implementadas
- **Severidad:** baja
- **Archivo/línea:** `index.js`, líneas 15-20, 23-55, 73-76, 146-155 y 158-165
- **Descripción:** El código generado sí valida el patrón `EST\\d{5}`, rechaza fechas futuras, restringe el estado a los tres valores esperados y evita duplicados de asistencia por estudiante y fecha.
- **Evidencia:** Existen funciones dedicadas para formato de código, estado y fecha, y además se validan antes de persistir datos.
- **Impacto:** La base funcional cumple varias reglas de negocio del enunciado, aunque todavía tiene vacíos operativos y de seguridad.

## Bugs confirmados por pruebas

- **Comando ejecutado:** `./.tools/node/bin/node ./node_modules/jest/bin/jest.js --verbose`
- **Resultado general:** 20 pruebas ejecutadas, 14 exitosas y 6 fallidas.

### Falla 1 — Duplicado de estudiante responde `400` en vez de `409`
- **Prueba:** `rechaza estudiante duplicado con codigo 409`
- **Archivo/línea:** `tests/api.test.js`, líneas 39-45
- **Qué reveló:** La API detecta el duplicado, pero usa un código HTTP incorrecto para un conflicto de unicidad.
- **Resultado observado:** esperado `409`, recibido `400`.

### Falla 2 — El listado público expone `correo`
- **Prueba:** `no deberia exponer el correo en el listado publico`
- **Archivo/línea:** `tests/api.test.js`, líneas 77-84
- **Qué reveló:** `GET /api/estudiantes` devuelve datos personales sin minimización.
- **Resultado observado:** el objeto de respuesta contiene la propiedad `correo`.

### Falla 3 — La consulta por ID expone `correo`
- **Prueba:** `no deberia exponer el correo al consultar por id`
- **Archivo/línea:** `tests/api.test.js`, líneas 95-102
- **Qué reveló:** `GET /api/estudiantes/:id` también devuelve datos personales completos.
- **Resultado observado:** el objeto de respuesta contiene la propiedad `correo`.

### Falla 4 — Duplicado de asistencia responde `400` en vez de `409`
- **Prueba:** `rechaza asistencia duplicada con codigo 409`
- **Archivo/línea:** `tests/api.test.js`, líneas 154-170
- **Qué reveló:** La regla de no duplicar asistencia está presente, pero la API responde con un código HTTP semánticamente incorrecto.
- **Resultado observado:** esperado `409`, recibido `400`.

### Falla 5 — El historial por estudiante expone `correo`
- **Prueba:** `no deberia exponer el correo dentro del historial`
- **Archivo/línea:** `tests/api.test.js`, líneas 205-212
- **Qué reveló:** `GET /api/asistencias/estudiante/:id` reexpone el objeto de estudiante con datos personales.
- **Resultado observado:** `res.body.estudiante` contiene la propiedad `correo`.

### Falla 6 — JSON inválido no devuelve error consistente en JSON
- **Prueba:** `responde con error JSON consistente cuando el body es invalido`
- **Archivo/línea:** `tests/api.test.js`, líneas 283-293
- **Qué reveló:** Cuando el payload es JSON malformado, Express devuelve `400` pero con `content-type: text/html` en vez de una respuesta JSON uniforme.
- **Resultado observado:** esperado `application/json`, recibido `text/html; charset=utf-8`.
