# Portada institucional

- Institución: Instituto Tecnologico de Ensenada
- Carrera: Ingeniería en Sistemas Computacionales
- Materia: DESARROLLO WEB 1
- Nombre de la actividad: Evaluación - "Sistema de Gestion Médica"  
- Estudiante: JUAN SEBASTIAN MORENO POSADA (22760047)  
- Docente: Xenia Padilla  
- Fecha: 2025-11-04
<img width="500" height="500" alt="image" src="https://github.com/user-attachments/assets/af2d476d-0757-46bc-83ec-fe9fb8925f39" />

---

# 🏥 Sistema de Gestión Médica (SGM)

## 🌟 Resumen del Proyecto

Este es un sistema web diseñado para la administración eficiente de pacientes, doctores y citas en una clínica o consultorio. El proyecto se enfoca en proporcionar un **Dashboard** intuitivo y en la gestión de las entidades principales mediante vistas de lista y registro.

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Versión/Descripción |
| :--- | :--- | :--- |
| **Backend** | **Node.js** | Entorno de ejecución de JavaScript. |
| **Framework** | **Express** | Framework rápido y minimalista para Node.js. |
| **Frontend** | **HTML5, CSS3, JavaScript (Vainilla)** | Estándares web para la interfaz de usuario. |
| **Persistencia**| **Archivos JSON** (simulando DB) | Utilizado para la persistencia de datos (pacientes, doctores, citas). |

---

## 🚀 Instalación y Ejecución

Sigue estos pasos para levantar el proyecto en tu entorno local.

### 1. Requisitos

Asegúrate de tener instalado **Node.js** (se recomienda la versión LTS) en tu sistema.

### 2. Instalación de Dependencias

1.  Clona este repositorio:
    ```bash
    git clone https://github.com/JuanSposada/GestionCitasMedicas.git
    cd GestionCitasMedicas
    ```
2.  Instala los módulos necesarios (Express):
    ```bash
    npm install express
    ```

### 3. Ejecutar el Proyecto

1.  Inicia el servidor Node.js (asumiendo que el archivo principal es `server.js`):
    ```bash
    node server.js
    ```
2.  Abre tu navegador web y navega a:
    ```
    http://localhost:3000
    ```

---

## 🏗️ Estructura del Proyecto

La aplicación se divide en un backend (`server.js`) y una carpeta pública (`public`) que contiene la lógica frontend y las vistas.

```
/

├── data/

│   ├── pacientes.json      # Almacenamiento de datos de pacientes

│   ├── doctores.json       # Almacenamiento de datos de doctores

│   └── citas.json          # Almacenamiento de datos de citas

├── public/

│   ├── css/

│   │   └── style.css       # Estilos generales del proyecto

│   ├── js/

|   |   ├── citas.js        # Sew creo solo para la logica de citas ya que main.js crecio demasiado.        

│   │   └── main.js         # Lógica central del frontend (peticiones API, DOM)

│   └── vistas/

│       ├── agendaDoctor.html  

│       ├── citas.html  

│       ├── dashboard.html  # Panel de Control principal

│       ├── doctores.html  

│       ├── editarDoctor.html  

│       ├── editarPaciente.html  

│       ├── historialPaciente.html  

│       ├── pacientes.html 

│       ├── registrarCita.html

│       ├── editarPaciente.html  

│       ├── registrarDoctor.html

│       ├── registrarPaciente.html 

└── server.js               # Servidor principal (Express y rutas)

└── fileManager.js          # Lógica para leer/escribir archivos JSON

└── README.md
```
## 🖼️ Capturas de Pantalla


### Dashboard Principal
<img width="1281" height="862" alt="image" src="https://github.com/user-attachments/assets/01f928d4-a86e-4903-a8ed-4ebae87fb036" />

### Vista de Gestión de Pacientes
<img width="1310" height="930" alt="image" src="https://github.com/user-attachments/assets/dfd41737-d9c4-4c90-a3c9-d811884747f3" />

### Historial Pacientes
<img width="1215" height="825" alt="image" src="https://github.com/user-attachments/assets/21b4d8b8-236c-42ac-b864-fc76b311b9e2" />

### Crear/Editar Paciente
<img width="853" height="837" alt="image" src="https://github.com/user-attachments/assets/6c2e9ca0-685b-4a73-a629-ec7f9d92ac50" />

### Vista de Gestión de Doctores
<img width="1345" height="911" alt="image" src="https://github.com/user-attachments/assets/e67d79ee-1499-4d7c-8248-76421f5cbff8" />

### Agenda Doctores
<img width="1211" height="908" alt="image" src="https://github.com/user-attachments/assets/bf01fd37-3b82-4940-847e-be1e43a2b13f" />

### Crear/editar Doctor
<img width="1272" height="661" alt="image" src="https://github.com/user-attachments/assets/d95e25ca-56ad-40eb-a10e-cd5fc3584810" />

### Vista de Gestión de Citas
<img width="1243" height="927" alt="image" src="https://github.com/user-attachments/assets/70d890c4-1a23-44ba-ae25-cd449a81d4d2" />

### Ver detalle de Cita
<img width="586" height="855" alt="image" src="https://github.com/user-attachments/assets/0edcc544-ef28-4f7e-bb35-4760705728aa" />

### Agendar Nueva Cita
<img width="860" height="940" alt="image" src="https://github.com/user-attachments/assets/ea791dab-28ba-43b0-aaee-b64ad80f1ab3" />



---

## 🧠 Decisiones de Diseño Clave

### 1. Arquitectura

* **Decisión:** Se utilizó una arquitectura de **Cliente-Servidor tradicional** con renderizado del lado del cliente.
* **Justificación:** Permite un desarrollo rápido sin la complejidad de frameworks de frontend (como React o Vue), manteniendo todo el control de las peticiones en JavaScript nativo (`main.js`).

### 2. Persistencia de Datos

* **Decisión:** Uso de **archivos JSON** (`data/*.json`) para simular la persistencia en lugar de una base de datos real (ej. MongoDB, SQL).
* **Justificación:** Acelera la fase de prototipado y evita la configuración de una DB externa, enfocando el desarrollo en la lógica de negocio.

### 3. Diseño de Interfaz (Dashboard)

* **Decisión:** El *Home* se convirtió en un **Dashboard** (Panel de Control).
* **Decisión:** Omision de Graficas para evitar implementar cambios en funcionalidad. 
* **Decisión:** Se utilizo el mismo formsto para registrar/editar. 
* **Decisión:** Se busco que la interfaz fuera sencilla e intuitiva.
* **Decisión:** Se agrego responsabilidad para movil.

---

## 🗺️ Flujos de Usuario Principales

| Flujo | Pasos de Usuario | Endpoints Utilizados |
| :--- | :--- | :--- |
| **Ver Resumen Diario**| 1. Navegar a `/vistas/dashboard.html` | `GET /api/dashboard/stats`, `GET /api/dashboard/citas-hoy`|
| **Registro de Paciente**| 1. Rellenar formulario en `/vistas/registrarPaciente.html` | `POST /api/pacientes` |
| **Gestión de Doctores**| 1. Navegar a `/vistas/doctores.html` | `GET /api/doctores`, `GET /api/doctores/:id` (para editar) |
| **Registro de Doctor**| 1. Rellenar formulario en `/vistas/registrarDoctor.html` | `POST /api/doctores` |
| **Consulta de citas programdas/canceladas**| 1. Navegar a `/vistas/citas.html` | `GET /api/citas` |
| **Crear nueva cita**| 1. Navegar a `/vistas/citas.html` | `POST /api/citas` |
| **Cancelar Cita**| 1. Navegar a `/vistas/citas.html` | `POST /api/citas/:id/cancelar` |
| **Ver Agenda de Doctor**| 1. Navegar a `/vistas/doctores.html` | `GET /api/citas/doctor/:doctorId` |
Y las operaciones basicas de CRUD para Doctores, Pacientes y Citas.

---
## 🐛 Problemas Encontrados y Soluciones Implementadas

| Problema | Solución Implementada |
| :--- | :--- |
| **Datos Relacionados en el Dashboard**| **Solución:** Las rutas `GET /api/dashboard/*` se modificaron en `server.js` para **enriquecer los datos de citas**. Se consulta el `pacienteId` y `doctorId` para mostrar sus respectivos nombres en la tabla de citas de hoy. |
| **Sincronización de Archivos JSON** | **Solución:** Se implementó una capa de **Gestión de Archivos** (`fileManager.js`) para manejar las operaciones de lectura y escritura de forma síncrona/asíncrona y evitar corrupción de datos al guardar simultáneamente. |
| **Búsqueda en Listados** | **Solución:** Se implementó lógica en **`main.js`** (`doctores.html`) para realizar la búsqueda por nombre o ID directamente en el *frontend* (filtrando la lista cargada), mejorando la velocidad de respuesta. |
| **Formatos de Fecha UTC y cambiarlos a UTC** | **Solución:** Se implementó lógica en **`main.js`** para poder manejar la fecha de PST manejar tanto las dias como las horas en comparacion a UTC  |


---


## 🌐 Endpoints Consumidos (API)

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
- El proyecto tiene muchas areas de oportunidad de mejora en cuanto a la UI/UX
- Este proyecto nos ayudo a poner en practica los conceptos aprendidos a lo largo del curso.
- Para futuras versiones se planea la integracion de componentes para generar una mejor experiencia de usuarios.

