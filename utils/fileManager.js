const fs = require('fs');
const path = require('path');

const CITAS_FILE = path.join(__dirname, '..', 'data', 'citas.json')
const PACIENTES_FILE = path.join(__dirname, '..', 'data', 'pacientes.json')
const DOCTORES_FILE = path.join(__dirname, '..', 'data', 'doctores.json')

const leerDB = (filePath)  =>{
    try{
        const data = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(data)
    } catch (error){
        return {usuarios: []}
    }
};

const escribirDB = (filePath, data) =>{
    try{
        fs.writeFileSync(filePath,
            JSON.stringify(data,null,2), 'utf-8'
        )
    } catch (error){
        return false;
    }
};

const generarNuevoId = (db,prefix) =>{
    if(db.length < 0) return `${prefix}001`;
    const numeros = db.map(u => parseInt(u.id.slice(1), 10))
    const siguienteNumero = Math.max(...numeros) + 1;
    const numeroFormateado = String(siguienteNumero).padStart(3,'0');
    return `${prefix}${numeroFormateado}`
}
function obtenerFechaActual() {
  const hoy = new Date();

  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');

  return `${año}-${mes}-${dia}`;
}

const obtenreRegistros = (filePath) =>{
    const db = leerDB(filePath);
    return db;
}

const obtenerDiaDeLaSemana = (fecha) => {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay();
    return dias[diaSemana].charAt(0).toUpperCase() + dias[diaSemana].slice(1);
}

//// Funciones para Pacientes ////////////7


const registrarPaciente = (nombre, edad, telefono, email) =>{
    const db = leerDB(PACIENTES_FILE);
    const nuevoId = generarNuevoId(db,'P')
    const fechaHoy = obtenerFechaActual()
    const nuevoPaciente = {id: nuevoId, nombre, edad, telefono, email, fechaRegistro : fechaHoy}
    db.push(nuevoPaciente)
    escribirDB(PACIENTES_FILE, db)
    return nuevoPaciente
}

const obtenerPacientes = () =>{
    return obtenreRegistros(PACIENTES_FILE);
}

const obtenerPacientePorId = (id) =>{
    const db = leerDB(PACIENTES_FILE);
    return db.find(p => p.id === id);
}

const actualizarPaciente = (id, nombre, edad, telefono, email) =>{
    const db = leerDB(PACIENTES_FILE);
    const index = db.findIndex(p => p.id === id);
    if(index === -1) return null;
    if(nombre) db[index].nombre = nombre;
    if(edad) db[index].edad = edad;
    if(telefono) db[index].telefono = telefono;
    if(email) db[index].email = email;
    escribirDB(PACIENTES_FILE, db);
    return db[index];
}

const historialPaciente = (id) => {
    const db = leerDB(CITAS_FILE);
    return db.filter(cita => cita.pacienteId === id);
}

const is_unique_email = (email) => {
    const db = leerDB(PACIENTES_FILE);
    const existing = db.find(p => p.email === email);
    return !existing;
}


///// Funciones para Doctores ////////////

const registrarDoctor = (nombre, especialidad, horarioInicio, horarioFin,diasDisponibles) =>{
     const db = leerDB(DOCTORES_FILE);
    const nuevoId = generarNuevoId(db,'D')
    const nuevoDoctor = {id: nuevoId, nombre, especialidad, horarioInicio, horarioFin,diasDisponibles}
    db.push(nuevoDoctor)
    escribirDB(DOCTORES_FILE, db)
    return nuevoDoctor
}

const obtenerDoctores = () =>{
    return obtenreRegistros(DOCTORES_FILE); 
}

const obtenerDoctorPorId = (id) =>{
    const db = leerDB(DOCTORES_FILE);
    return db.find(d => d.id === id);
}

const buscarDoctoresPorEspecialidad = (especialidad) =>{
    const db = leerDB(DOCTORES_FILE);
    return db.filter(d => d.especialidad.toLowerCase() === especialidad.toLowerCase());
}

const isDuplicatedDoctor = (nombre, especialidad) => {
    const db = leerDB(DOCTORES_FILE);
    const existing = db.find(d => d.nombre === nombre && d.especialidad === especialidad);
    return !existing;
}

/// Funciones de Citas ///////

const agendarCita = (pacienteId, doctorId, fecha, hora, motivo, estado) =>{
    const db = leerDB(CITAS_FILE);
    const nuevoId = generarNuevoId(db,'C')
    const nuevaCita = {id: nuevoId, pacienteId, doctorId, fecha, hora, motivo, estado}
    db.push(nuevaCita)
    escribirDB(CITAS_FILE, db)
    return nuevaCita
}

const obtenerCitas = () =>{
    return obtenreRegistros(CITAS_FILE); 
}

const obtenerCitaPorId = (id) =>{
    const db = leerDB(CITAS_FILE);
    return db.find(c => c.id === id);
}

const cancelarCita = (id) =>{
    const db = leerDB(CITAS_FILE);
    const index = db.findIndex(c => c.id === id);
    if(index === -1) return false;
    db[index].estado = 'cancelada';
    escribirDB(CITAS_FILE, db);
    return true;    
}

const obtenerCitasDeDoctor = (doctorId) =>{
    const db = leerDB(CITAS_FILE);
    return db.filter(cita => cita.doctorId === doctorId);
}

const isPacienteResgitrado = (pacienteId) => {
    const db = leerDB(PACIENTES_FILE);
    return db.some(p => p.id === pacienteId);
}


//// Funcionalidades Estadisticas ///////

const doctorConMasCitas = () => {
    const citas = leerDB(CITAS_FILE);
    const contador = {};
    citas.forEach(cita => {
        if(!contador[cita.doctorId]){
            contador[cita.doctorId] = 0;
        }
        contador[cita.doctorId]++;
    });
    let maxCitas = 0;
    let doctorIdConMasCitas = null;
    for(const doctorId in contador){
        if(contador[doctorId] > maxCitas){
            maxCitas = contador[doctorId];
            doctorIdConMasCitas = doctorId;
        }
    }
    return {doctorId: doctorIdConMasCitas, totalCitas: maxCitas};
}

const especialidadMasSolicitada = () => {
    const citas = leerDB(CITAS_FILE);
    const doctores = leerDB(DOCTORES_FILE);
    const contador = {};        
    citas.forEach(cita => {
        const doctor = doctores.find(d => d.id === cita.doctorId);
        if(doctor){
            const especialidad = doctor.especialidad;
            if(!contador[especialidad]){
                contador[especialidad] = 0;
            }
            contador[especialidad]++;
        }
    });
    let maxSolicitudes = 0;
    let especialidadMasSolicitada = null;
    for(const especialidad in contador){
        if(contador[especialidad] > maxSolicitudes){
            maxSolicitudes = contador[especialidad];
            especialidadMasSolicitada = especialidad;
        }
    }
    return {especialidad: especialidadMasSolicitada, totalSolicitudes: maxSolicitudes};
}

///// Busquedas Avanzadas ///////

const buscarCitasPorFechaYEstado = (fecha, estado) => {
  const db = leerDB(CITAS_FILE);
  return db.filter(cita =>
    cita.fecha === fecha &&
    cita.estado.toLowerCase() === estado.toLowerCase()
  );
};

const buscarDoctoresDisponibles = (fecha, hora) => {
  const dbDoctores = leerDB(DOCTORES_FILE);
  const dbCitas = leerDB(CITAS_FILE);
  const diaSemana = obtenerDiaDeLaSemana(fecha);

  return dbDoctores.filter(doctor => {
    // Validar día disponible
    if (!doctor.diasDisponibles.includes(diaSemana)) {
      return false;
    }

    // Validar horario disponible
    if (hora < doctor.horarioInicio || hora > doctor.horarioFin) {
      return false;
    }

    // Validar que no haya cita en ese horario
    const citasEnEseDia = dbCitas.filter(cita =>
      cita.doctorId === doctor.id &&
      cita.fecha === fecha &&
      cita.hora === hora &&
      cita.estado === 'programada'
    );

    return citasEnEseDia.length === 0;
  });
};

const citasProximas24Horas = () => {
  const dbCitas = leerDB(CITAS_FILE);
  const ahora = new Date();
  console.log('Fecha y hora actual:', ahora.toISOString());
  const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

  console.log('Ahora:', ahora.toISOString());
  console.log('En 24 horas:', en24Horas.toISOString());

  return dbCitas.filter(cita => {
    const fechaCita = new Date(`${cita.fecha}T${cita.hora}:00-08:00`);
    console.log('Evaluando cita:', fechaCita.toISOString());

    return (
      fechaCita >= ahora &&
      fechaCita <= en24Horas &&
      cita.estado === 'programada'
    );
  });
};

///Exportacion de modulos ///////
module.exports = {
    leerDB,
    escribirDB,
    registrarPaciente,
    obtenerPacientes,
    obtenerPacientePorId,
    actualizarPaciente,
    historialPaciente,
    registrarDoctor,
    obtenerDoctores,
    obtenerDoctorPorId,
    buscarDoctoresPorEspecialidad,
    agendarCita,
    obtenerCitas,
    obtenerCitaPorId,
    cancelarCita,
    obtenerCitasDeDoctor,
    is_unique_email,
    isDuplicatedDoctor, 
    isPacienteResgitrado,
    obtenerFechaActual,
    obtenerDiaDeLaSemana,
    doctorConMasCitas,
    especialidadMasSolicitada,
    buscarCitasPorFechaYEstado,
    buscarDoctoresDisponibles, 
    citasProximas24Horas
};
