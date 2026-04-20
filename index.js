const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/ui", express.static(path.join(__dirname, "public")));

const estudiantes = [];
const asistencias = [];

function resetData() {
  estudiantes.length = 0;
  asistencias.length = 0;
}

function generarId(lista) {
  return lista.length ? Math.max(...lista.map((item) => item.id)) + 1 : 1;
}

function esCodigoValido(codigo) {
  return /^EST\d{5}$/.test(codigo);
}

function esEstadoValido(estado) {
  return ["presente", "ausente", "justificada"].includes(estado);
}

function normalizarFecha(fecha) {
  if (typeof fecha !== "string") {
    return null;
  }

  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!fechaRegex.test(fecha)) {
    return null;
  }

  const date = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const [year, month, day] = fecha.split("-").map(Number);
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return fecha;
}

function esFechaFutura(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaEvaluada = new Date(`${fecha}T00:00:00`);
  return fechaEvaluada > hoy;
}

app.get("/", (req, res) => {
  res.json({
    mensaje: "API de asistencia estudiantil funcionando"
  });
});

app.get("/api/estado", (req, res) => {
  res.json({
    mensaje: "API de asistencia estudiantil funcionando"
  });
});

app.get("/ui", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/estudiantes", (req, res) => {
  const { nombre, codigo, correo } = req.body;

  if (!nombre || !codigo) {
    return res.status(400).json({
      error: "Los campos nombre y codigo son obligatorios"
    });
  }

  if (!esCodigoValido(codigo)) {
    return res.status(400).json({
      error: "El codigo debe tener formato EST + 5 digitos"
    });
  }

  const codigoExistente = estudiantes.find((estudiante) => estudiante.codigo === codigo);
  if (codigoExistente) {
    return res.status(400).json({
      error: "El codigo del estudiante ya existe"
    });
  }

  const nuevoEstudiante = {
    id: generarId(estudiantes),
    nombre,
    codigo,
    correo: correo || null,
    creadoEn: new Date().toISOString()
  };

  estudiantes.push(nuevoEstudiante);

  return res.status(201).json(nuevoEstudiante);
});

app.get("/api/estudiantes", (req, res) => {
  res.json(estudiantes);
});

app.get("/api/estudiantes/:id", (req, res) => {
  const id = Number(req.params.id);
  const estudiante = estudiantes.find((item) => item.id === id);

  if (!estudiante) {
    return res.status(404).json({
      error: "Estudiante no encontrado"
    });
  }

  return res.json(estudiante);
});

app.post("/api/asistencias", (req, res) => {
  const { estudianteId, fecha, estado } = req.body;

  if (estudianteId === undefined || !fecha || !estado) {
    return res.status(400).json({
      error: "Los campos estudianteId, fecha y estado son obligatorios"
    });
  }

  const id = Number(estudianteId);
  if (Number.isNaN(id)) {
    return res.status(400).json({
      error: "El estudianteId debe ser numerico"
    });
  }

  const estudiante = estudiantes.find((item) => item.id === id);
  if (!estudiante) {
    return res.status(404).json({
      error: "Estudiante no encontrado"
    });
  }

  const fechaNormalizada = normalizarFecha(fecha);
  if (!fechaNormalizada) {
    return res.status(400).json({
      error: "La fecha debe tener formato YYYY-MM-DD y ser valida"
    });
  }

  if (esFechaFutura(fechaNormalizada)) {
    return res.status(400).json({
      error: "La fecha no puede ser futura"
    });
  }

  if (!esEstadoValido(estado)) {
    return res.status(400).json({
      error: "El estado debe ser presente, ausente o justificada"
    });
  }

  const asistenciaExistente = asistencias.find(
    (item) => item.estudianteId === id && item.fecha === fechaNormalizada
  );

  if (asistenciaExistente) {
    return res.status(400).json({
      error: "Ya existe una asistencia registrada para este estudiante en esa fecha"
    });
  }

  const nuevaAsistencia = {
    id: generarId(asistencias),
    estudianteId: id,
    fecha: fechaNormalizada,
    estado
  };

  asistencias.push(nuevaAsistencia);

  return res.status(201).json(nuevaAsistencia);
});

app.get("/api/asistencias/estudiante/:id", (req, res) => {
  const id = Number(req.params.id);
  const estudiante = estudiantes.find((item) => item.id === id);

  if (!estudiante) {
    return res.status(404).json({
      error: "Estudiante no encontrado"
    });
  }

  const historial = asistencias.filter((item) => item.estudianteId === id);

  return res.json({
    estudiante,
    asistencias: historial
  });
});

app.get("/api/reportes/ausentismo", (req, res) => {
  const reporte = estudiantes
    .map((estudiante) => {
      const totalAusencias = asistencias.filter(
        (asistencia) =>
          asistencia.estudianteId === estudiante.id && asistencia.estado === "ausente"
      ).length;

      return {
        estudianteId: estudiante.id,
        nombre: estudiante.nombre,
        codigo: estudiante.codigo,
        ausencias: totalAusencias
      };
    })
    .sort((a, b) => b.ausencias - a.ausencias || a.estudianteId - b.estudianteId)
    .slice(0, 5);

  return res.json(reporte);
});

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada"
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = {
  app,
  resetData
};
