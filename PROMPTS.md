# PROMPTS.md — Prompts utilizados por fase

---

## Fase 1 — Vibe coding

**Prompt 1.1**
```
API REST Node.js + Express para asistencia estudiantil, sin base de datos (arreglos en memoria).

Endpoints:
  POST   /api/estudiantes
  GET    /api/estudiantes
  GET    /api/estudiantes/:id
  POST   /api/asistencias
  GET    /api/asistencias/estudiante/:id
  GET    /api/reportes/ausentismo   ← top 5 con más ausencias

Reglas:
- codigo: /^EST\d{5}$/, único
- estado: "presente" | "ausente" | "justificada"
- fecha: YYYY-MM-DD, no futura, no inválida
- no duplicar (estudianteId + fecha)

Códigos HTTP: 201 al crear, 400 payload inválido, 404 no encontrado, 409 duplicado, 500 inesperado.


Solo express, nada más. Dame index.js completo.
```

---

**Prompt 1.2**
```
El index.js que generaste comparte estado entre pruebas porque estudiantes[] y asistencias[]
viven en el módulo y nunca se limpian.

Agrega esto y nada más:

  function resetData() {
    estudiantes.length = 0;
    asistencias.length = 0;
  }
  module.exports = { app, resetData };

No toques ningún endpoint.
```

---

## Fase 2 — Auditoría

**Prompt 2.1**
```
Revisa el index.js adjunto y dime los códigos HTTP que están mal.
Busca específicamente:
- 400 donde debería ir 409 (duplicado != payload inválido)
- ausencia de 404 en búsquedas por ID
- ausencia de middleware (err, req, res, next) para 500

Dame una tabla: Endpoint | código actual | código correcto | línea en index.js
No toques el código.
```

---

**Prompt 2.2**
```

Lista todos los endpoints GET que exponen correo y si ese campo es necesario en cada uno.
Sin cambios al código todavía.
```

---

**Prompt 2.3**
```
Sin modificar nada, dime qué pasa si este servidor Express se publica tal cual:
- ¿Sin CORS qué puede hacer un navegador que consuma esta API desde otro origen?

Checklist con severidad alta/media/baja.
```

---

**Prompt 2.4**
```
Revisa la lógica de generarId():

No corrijas nada, solo explica el riesgo y a partir de qué tamaño se vuelve problema.
```

---

## Fase 3 — Pruebas retroactivas

**Prompt 3.1**
```
Suite Jest + Supertest para index.js.
- { app, resetData } desde '../index', resetData() en beforeEach
- describe por endpoint, un test por caso

Cubre: creación exitosa de estudiante, código inválido, duplicado (409 no 400),
campos faltantes, listado vacío y con datos, que correo no aparezca en ningún GET,
404 por id inexistente, asistencia válida, estado fuera del enum, fecha futura,
asistencia duplicada (409), historial, ausentismo vacío / 1 estudiante / varios ordenados,
y JSON malformado que devuelva 400 con content-type JSON.

Dame tests/api.test.js completo.
```

---

**Prompt 3.2**
```
Pegando output de npm test — varios en rojo.
Por cada fallo: línea de index.js, qué devuelve ahora vs qué debería devolver.
Sin tocar código.
```

---

## Fase 4 — Refactorización agéntica

**Prompt 4.1**
```
Hallazgos 2 y 3 del AUDITORIA.md.
Línea 107 y 189 de index.js: los dos res.status(400) de duplicados → res.status(409).
Solo esos dos cambios, muéstrame el diff.
```

---

**Prompt 4.2**
```
Hallazgos 4 y 11: serializarEstudiantePublico() existe pero no se aplica en el POST
(línea 122) ni en el GET de historial (línea 218). Aplícala en los dos.
El test de creación en tests/api.test.js espera correo en el body — quita ese campo
del toMatchObject. Diff de ambos archivos, nada más.
```

---

**Prompt 4.3**
```
Test 20 falla: body JSON inválido → Express responde text/html.
El middleware (err, req, res, next) al final de index.js no está capturando
el SyntaxError de express.json(). Condición: err instanceof SyntaxError && err.status === 400 && 'body' in err.
Corrígelo, solo ese bloque.
```

---

**Prompt 4.4**
```
20/20 en verde. Dos preguntas antes de cerrar:
¿normalizarFecha rechaza "2026-02-30" y "2026-13-01"? Traza el flujo.
¿Qué hallazgos del AUDITORIA.md quedaron sin corregir y por qué?
```
