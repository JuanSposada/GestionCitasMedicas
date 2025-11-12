# Portada institucional

- Institución: Instituto Tecnologico de Ensenada
- Carrera: Ingeniería de Sistemas  
- Materia: DESARROLLO WEB 1
- Nombre de la actividad: Evaluación - API "Citas Médicas"  
- Estudiante: JUAN SEBASTIAN MORENO POSADA (22760047)  
- Docente: Xenia Padilla  
- Fecha: 2025-11-08

---

# Descripción
API REST para gestionar pacientes, doctores y citas médicas. Código principal en `server.js` y lógica de lectura/escritura en `utils/fileManager.js`. Los datos se almacenan en JSON en la carpeta `data/`: `data/pacientes.json`, `data/doctores.json`, `data/citas.json`.

---

# Requisitos e instalación

Requisitos:
- Node.js (>=14)
- npm

Instalación y ejecución:
```bash
# instalar dependencias
npm install

# instalar dependencias
npm install express

# iniciar en modo producción
npm run start

# iniciar en modo desarrollo (con nodemon)
npm run dev
```

Archivos principales:
- `server.js` — define endpoints y flujo.
- `utils/fileManager.js` — operaciones de lectura/escritura y funciones de negocio.
- `data/` — almacenamiento JSON.

---

# Endpoints (base: http://localhost:3000)

1) Crear paciente  
- POST /api/pacientes  
- Request:
```json
{
  "nombre": "Ana Pérez",
  "edad": 30,
  "telefono": "555-1111",
  "email": "ana.p@email.com"
}
```
- Response 201:
```json
{
  "success": true,
  "data": {
    "id": "P004",
    "nombre": "Ana Pérez",
    "edad": 30,
    "telefono": "555-1111",
    "email": "ana.p@email.com",
    "fechaRegistro": "2025-11-08"
  }
}
```
- Errores comunes: 400 validación, 409 email duplicado.

2) Listar pacientes  
- GET /api/pacientes  
- Response 200: `{ "success": true, "data": [ ... ] }`

3) Obtener paciente por ID  
- GET /api/pacientes/:id  
- Response 200 o 404 si no existe.

4) Actualizar paciente  
- PUT /api/pacientes/:id  
- Body: campos a actualizar. Respuesta 200 o 404.

5) Registrar doctor  
- POST /api/doctores  
- Request:
```json
{
  "nombre": "Dr. X",
  "especialidad": "Cardiología",
  "horarioInicio": "09:00",
  "horarioFin": "17:00",
  "diasDisponibles": ["Lunes","Martes","Miércoles"]
}
```
- Response 201 o 400 si faltan campos o existe duplicado.

6) Listar / obtener doctores  
- GET /api/doctores  
- GET /api/doctores/:id  
- GET /api/doctores/especialidad/:especialidad

7) Agendar cita  
- POST /api/citas  
- Validaciones: paciente y doctor existen, fecha no en pasado, doctor disponible en día y hora, no solapamiento.  
- Request:
```json
{
  "pacienteId":"P001",
  "doctorId":"D001",
  "fecha":"2025-11-10",
  "hora":"10:00",
  "motivo":"Revisión",
  "estado":"programada"
}
```
- Response 201 o 400 con motivo del error.

8) Listar / obtener / cancelar citas  
- GET /api/citas  
- GET /api/citas/:id  
- PUT /api/citas/:id/cancelar — solo citas en estado `programada`.

9) Consultas y utilidades
- GET /api/doctores/disponibles?fecha=YYYY-MM-DD&hora=HH:MM  
- GET /api/citas?fecha=YYYY-MM-DD&estado=programada  
- GET /api/notificaciones/citas-proximas — citas en 24 horas  
- Estadísticas: `/api/estadisticas/doctores`, `/api/estadisticas/especialidades`

---

# Ejemplos curl rápidos

- Crear paciente:
```bash
curl -X POST http://localhost:3000/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana Pérez","edad":30,"telefono":"555-1111","email":"ana.p@email.com"}'
```

- Buscar doctores disponibles:
```bash
curl "http://localhost:3000/api/doctores/disponibles?fecha=2025-11-10&hora=10:00"
```

- Cancelar cita:
```bash
curl -X PUT http://localhost:3000/api/citas/C001/cancelar
```

---

# Casos de prueba realizados (resumen)

Resultados (OK = pasado):

1. Crear paciente válido -> OK  
2. Crear paciente con email duplicado -> OK (409)  
3. Crear paciente con edad <= 0 -> OK (400)  
4. Obtener paciente inexistente -> OK (404)  
5. Registrar doctor con campos faltantes -> OK (400)  
6. Registrar doctor duplicado -> OK (400)  
7. Agendar cita válida -> OK  
8. Agendar cita en fecha pasada -> OK (400)  
9. Agendar cita con doctor no disponible -> OK (400)  
10. Agendar cita con choque de horario -> OK (400)  
11. Cancelar cita en estado distinto a 'programada' -> OK (400)  
12. Obtener estadísticas de doctor con más citas -> OK  
13. Buscar doctores disponibles -> OK  
14. Notificaciones: citas próximas 24h -> OK

Para reproducir: usar curl o Postman contra `server.js`. Las funciones principales están en `utils/fileManager.js`.

---

# Notas finales
- Mantener validación tanto en capas de request (middleware) como en modelo/almacenamiento.  
- Si se desea, puedo crear el archivo README.md directamente en el proyecto (indica si quieres que lo haga).  