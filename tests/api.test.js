const request = require("supertest");
const { app, resetData } = require("../index");

function crearEstudiante(body = {}) {
  return request(app).post("/api/estudiantes").send({
    nombre: "Juan Perez",
    codigo: "EST00123",
    correo: "juan@correo.com",
    ...body
  });
}

describe("API de asistencia estudiantil", () => {
  beforeEach(() => {
    resetData();
  });

  describe("POST /api/estudiantes", () => {
    test("crea un estudiante correctamente", async () => {
      const res = await crearEstudiante();

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        id: 1,
        nombre: "Juan Perez",
        codigo: "EST00123",
        correo: "juan@correo.com"
      });
      expect(res.body).toHaveProperty("creadoEn");
    });

    test("rechaza un codigo con formato invalido", async () => {
      const res = await crearEstudiante({ codigo: "abc" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    test("rechaza estudiante duplicado con codigo 409", async () => {
      await crearEstudiante();
      const res = await crearEstudiante({ nombre: "Maria Lopez" });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty("error");
    });

    test("rechaza cuando faltan campos obligatorios", async () => {
      const res = await request(app).post("/api/estudiantes").send({ codigo: "EST00124" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/estudiantes", () => {
    test("devuelve listado vacio al iniciar", async () => {
      const res = await request(app).get("/api/estudiantes");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("devuelve estudiantes creados", async () => {
      await crearEstudiante();
      await crearEstudiante({
        nombre: "Maria Lopez",
        codigo: "EST00124",
        correo: "maria@correo.com"
      });

      const res = await request(app).get("/api/estudiantes");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test("no deberia exponer el correo en el listado publico", async () => {
      await crearEstudiante();

      const res = await request(app).get("/api/estudiantes");

      expect(res.statusCode).toBe(200);
      expect(res.body[0]).not.toHaveProperty("correo");
    });
  });

  describe("GET /api/estudiantes/:id", () => {
    test("devuelve 404 para un estudiante inexistente", async () => {
      const res = await request(app).get("/api/estudiantes/999");

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    test("no deberia exponer el correo al consultar por id", async () => {
      await crearEstudiante();

      const res = await request(app).get("/api/estudiantes/1");

      expect(res.statusCode).toBe(200);
      expect(res.body).not.toHaveProperty("correo");
    });
  });

  describe("POST /api/asistencias", () => {
    async function crearEstudianteBase() {
      await crearEstudiante();
    }

    test("registra una asistencia valida", async () => {
      await crearEstudianteBase();

      const res = await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2026-04-20",
        estado: "presente"
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        id: 1,
        estudianteId: 1,
        fecha: "2026-04-20",
        estado: "presente"
      });
    });

    test("rechaza estado no permitido", async () => {
      await crearEstudianteBase();

      const res = await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2026-04-20",
        estado: "tarde"
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    test("rechaza fecha futura", async () => {
      await crearEstudianteBase();

      const res = await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2099-01-01",
        estado: "presente"
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    test("rechaza asistencia duplicada con codigo 409", async () => {
      await crearEstudianteBase();
      await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2026-04-20",
        estado: "ausente"
      });

      const res = await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2026-04-20",
        estado: "presente"
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty("error");
    });

    test("rechaza cuando faltan campos obligatorios", async () => {
      await crearEstudianteBase();

      const res = await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        estado: "presente"
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/asistencias/estudiante/:id", () => {
    test("devuelve historial de asistencias para un estudiante", async () => {
      await crearEstudiante();
      await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2026-04-18",
        estado: "presente"
      });
      await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2026-04-19",
        estado: "ausente"
      });

      const res = await request(app).get("/api/asistencias/estudiante/1");

      expect(res.statusCode).toBe(200);
      expect(res.body.asistencias).toHaveLength(2);
    });

    test("no deberia exponer el correo dentro del historial", async () => {
      await crearEstudiante();

      const res = await request(app).get("/api/asistencias/estudiante/1");

      expect(res.statusCode).toBe(200);
      expect(res.body.estudiante).not.toHaveProperty("correo");
    });
  });

  describe("GET /api/reportes/ausentismo", () => {
    test("devuelve arreglo vacio cuando no hay estudiantes", async () => {
      const res = await request(app).get("/api/reportes/ausentismo");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("cuenta una ausencia para un estudiante", async () => {
      await crearEstudiante();
      await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2026-04-20",
        estado: "ausente"
      });

      const res = await request(app).get("/api/reportes/ausentismo");

      expect(res.statusCode).toBe(200);
      expect(res.body[0]).toMatchObject({
        estudianteId: 1,
        ausencias: 1
      });
    });

    test("ordena varios estudiantes por cantidad de ausencias", async () => {
      await crearEstudiante();
      await crearEstudiante({
        nombre: "Maria Lopez",
        codigo: "EST00124",
        correo: "maria@correo.com"
      });
      await crearEstudiante({
        nombre: "Ana Ruiz",
        codigo: "EST00125",
        correo: "ana@correo.com"
      });

      await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2026-04-15",
        estado: "ausente"
      });
      await request(app).post("/api/asistencias").send({
        estudianteId: 1,
        fecha: "2026-04-16",
        estado: "ausente"
      });
      await request(app).post("/api/asistencias").send({
        estudianteId: 2,
        fecha: "2026-04-17",
        estado: "ausente"
      });
      await request(app).post("/api/asistencias").send({
        estudianteId: 3,
        fecha: "2026-04-18",
        estado: "presente"
      });

      const res = await request(app).get("/api/reportes/ausentismo");

      expect(res.statusCode).toBe(200);
      expect(res.body[0]).toMatchObject({ estudianteId: 1, ausencias: 2 });
      expect(res.body[1]).toMatchObject({ estudianteId: 2, ausencias: 1 });
      expect(res.body[2]).toMatchObject({ estudianteId: 3, ausencias: 0 });
    });
  });

  describe("manejo de payload malformado", () => {
    test("responde con error JSON consistente cuando el body es invalido", async () => {
      const res = await request(app)
        .post("/api/estudiantes")
        .set("Content-Type", "application/json")
        .send('{"nombre":"Juan",');

      expect(res.statusCode).toBe(400);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      expect(res.body).toHaveProperty("error");
    });
  });
});
