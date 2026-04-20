# API de Asistencia Estudiantil

API REST en Node.js y Express para gestionar estudiantes, asistencias y reportes de ausentismo.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` si quieres usar configuración local:

```bash
cp .env.example .env
```

Variables disponibles:

- `PORT`: puerto del servidor local. Valor por defecto: `3000`

## Ejecución local

```bash
npm start
```

Servidor local:

- API: `http://localhost:3000`
- Interfaz visual: `http://localhost:3000/ui`

## Pruebas

```bash
npm test
```

## Auditoría de dependencias

```bash
npm audit
```

Resultado actual de referencia:

- `0` vulnerabilidades encontradas

## Endpoints

- `GET /api/estado`
- `POST /api/estudiantes`
- `GET /api/estudiantes`
- `GET /api/estudiantes/:id`
- `POST /api/asistencias`
- `GET /api/asistencias/estudiante/:id`
- `GET /api/reportes/ausentismo`

## Ejemplos rápidos

Crear estudiante:

```bash
curl -X POST http://localhost:3000/api/estudiantes \
-H "Content-Type: application/json" \
-d '{
  "nombre": "Maria Lopez",
  "codigo": "EST00124",
  "correo": "maria@correo.com"
}'
```

Registrar asistencia:

```bash
curl -X POST http://localhost:3000/api/asistencias \
-H "Content-Type: application/json" \
-d '{
  "estudianteId": 1,
  "fecha": "2026-04-20",
  "estado": "ausente"
}'
```

Ver reporte de ausentismo:

```bash
curl http://localhost:3000/api/reportes/ausentismo
```

## Reglas de negocio implementadas

- El código del estudiante debe cumplir el formato `EST` + 5 dígitos
- No se permiten códigos de estudiante duplicados
- Los estados válidos son `presente`, `ausente` y `justificada`
- No se permite duplicar asistencia para el mismo estudiante y la misma fecha
- No se permiten fechas futuras
- Las respuestas públicas no exponen el campo `correo`
