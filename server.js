const express = require('express');
const app = express();
const path = require('path');
const port = 3000;
const {leerDB,
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
    obtenerFechaActual,
    obtenerDiaDeLaSemana,
    doctorConMasCitas,
    especialidadMasSolicitada,
    buscarCitasPorFechaYEstado,
    buscarDoctoresDisponibles,
    citasProximas24Horas
 } = require('./utils/fileManager');

app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    // Envía el archivo 'home.html' que estará dentro de 'public/vistas/'
    res.sendFile(path.join(__dirname, 'public', 'vistas', 'dashboard.html'));
});

//////// Endpoints Pacientes /////////
app.post('/api/pacientes', (req, res) =>{
    const {nombre, edad, telefono, email} = req.body
    if(edad <= 0){
        return  res.status(400).json({
            success: false,
            message: 'Edad debe ser mayor a 0'})
    }
    if(!is_unique_email(email)){
        return  res.status(400).json({
            success: false,
            message: 'Este email ya está registrado, ingresa otro'})
    }
    if(!nombre || !edad || !telefono || !email){
        return  res.status(400).json({
            success: false,
            message: 'Faltan datos obligatorios'})
    }
    const nuevoPaciente = registrarPaciente(nombre, edad, telefono, email)
    return res.status(201).json({
        success: true,
        data: nuevoPaciente
    })
})

app.get('/api/pacientes', (req, res) =>{
    const pacientes = obtenerPacientes()
    return res.status(200).json({
        success: true,
        data: pacientes
    })
})

app.get('/api/pacientes/:id', (req, res) =>{
    const {id} = req.params
    const paciente = obtenerPacientePorId(id)
    if(!paciente){
        return res.status(404).json({
            success: false,
            message: 'ID no encontrado'
        })
    }
    return res.status(200).json({
        success: true,
        data: paciente
    })
})

app.put('/api/pacientes/:id', (req, res) =>{
    const {id} = req.params
    const {nombre, edad, telefono, email} = req.body
    const pacienteActualizado = actualizarPaciente(id, nombre, edad, telefono, email)
    if(!pacienteActualizado){
        return res.status(404).json({
            success: false,
            message: 'ID no encontrado'
        })
    }
    return res.status(200).json({
        success: true,
        data: pacienteActualizado
    })
})

app.get('/api/pacientes/:id/historial', (req, res) =>{
    const {id} = req.params
    const historial = historialPaciente(id)
    return res.status(200).json({
        success: true,
        data: historial
    })
})

//////// Endpoints Doctores /////////

app.post('/api/doctores', (req, res) =>{
    const {nombre, especialidad, horarioInicio, horarioFin,diasDisponibles} = req.body    
    if(!nombre || !especialidad || !horarioInicio || !horarioFin || !diasDisponibles){
        return  res.status(400).json({
            success: false,
            message: 'Faltan datos obligatorios'})
    }
    if(isDuplicatedDoctor(nombre, especialidad)){
        return  res.status(400).json({
            success: false,
            message: 'Este doctor ya está registrado en la misma especialidad, ingresa otro'})
    }
    if(horarioInicio >= horarioFin){
        return  res.status(400).json({
            success: false,
            message: 'El horario de inicio debe ser menor al horario de fin'})
    }

    const nuevoDoctor = registrarDoctor(nombre, especialidad, horarioInicio, horarioFin,diasDisponibles)
    return res.status(201).json({
        success: true,
        data: nuevoDoctor
    })
})

app.get('/api/doctores', (req, res) =>{
    const doctores = obtenerDoctores()
    return res.status(200).json({
        success: true,
        data: doctores
    })
})

app.get('/api/doctores/:id', (req, res) =>{
    const {id} = req.params
    console.log('Buscando doctor por ID:', id);

    const doctor = obtenerDoctorPorId(id)
    if(!doctor){
        return res.status(404).json({
            success: false,
            message: 'ID no encontrado'
        })
    }
    return res.status(200).json({
        success: true,
        data: doctor
    })
})

app.get('/api/doctores/especialidad/:especialidad', (req, res) =>{
    const {especialidad} = req.params
    const doctores = buscarDoctoresPorEspecialidad(especialidad)
    if(doctores.length === 0){
        return res.status(404).json({
            success: false,
            message: 'No se encontraron doctores con esa especialidad'
        })
    }
    return res.status(200).json({
        success: true,
        data: doctores
    })
})

//////// Endpoints Citas /////////

app.post('/api/citas', (req, res) =>{
    const {pacienteId, doctorId, fecha, hora, motivo, estado} = req.body
    if(!pacienteId || !doctorId || !fecha || !hora || !motivo || !estado){
        return  res.status(400).json({
            success: false,
            message: 'Faltan datos obligatorios'})
    }
    if(!obtenerPacientePorId(pacienteId)){
        return  res.status(400).json({
            success: false,
            message: 'El paciente no está registrado'})
    }
    if(!obtenerDoctorPorId(doctorId)){
        return  res.status(400).json({
            success: false,
            message: 'El doctor no está registrado'})
    }
    if(fecha < obtenerFechaActual()){
        return  res.status(400).json({
            success: false,
            message: 'La fecha de la cita no puede ser en el pasado'})
    }
    const diaCita = obtenerDiaDeLaSemana(fecha)
    const doctor = obtenerDoctorPorId(doctorId)
    if(!doctor.diasDisponibles.includes(diaCita)){
        return  res.status(400).json({
            success: false,
            message: `El doctor no esta disponible los días ${diaCita}`})
    }
    if(hora < doctor.horarioInicio || hora > doctor.horarioFin){
        return  res.status(400).json({
            success: false,
            message: `La hora de la cita debe estar dentro del horario del doctor: ${doctor.horarioInicio} - ${doctor.horarioFin}`})
    }
    citasDoctor = obtenerCitasDeDoctor(doctorId)
    const citaExistente = citasDoctor.find(cita => cita.fecha === fecha && cita.hora === hora && cita.estado !== 'cancelada')
    if(citaExistente){
        return  res.status(400).json({
            success: false,
            message: 'El doctor ya tiene una cita agendada en esa fecha y hora'})
    }
    const nuevaCita = agendarCita(pacienteId, doctorId, fecha, hora, motivo, estado)
    return res.status(201).json({
        success: true,
        data: nuevaCita
    })
})

app.get('/api/citas', (req, res) => {
    const { fecha, estado } = req.query;
    console.log('Parámetros recibidos:', { fecha, estado });

    // 1. Obtener la lista base de citas (todas)
    let citas = obtenerCitas();

    // 2. Aplicar filtro por FECHA: Si el parámetro 'fecha' está presente, filtramos.
    if (fecha) {
        citas = citas.filter(cita => cita.fecha === fecha);
    }
    
    // 3. Aplicar filtro por ESTADO: Si el parámetro 'estado' está presente, 
    // filtramos sobre el resultado del paso anterior.
    if (estado) {
        citas = citas.filter(cita => cita.estado.toLowerCase() === estado.toLowerCase());
    }

    return res.status(200).json({
        success: true,
        data: citas
    });
});

app.get('/api/citas/:id', (req, res) =>{
    const {id} = req.params
    const cita = obtenerCitaPorId(id)
    if(!cita){
        return res.status(404).json({
            success: false,
            message: 'ID no encontrado'
        })
    }
    return res.status(200).json({
        success: true,
        data: cita
    })
})

app.put('/api/citas/:id/cancelar', (req, res) =>{
    const {id} = req.params
    const cita = obtenerCitaPorId(id)
    if(cita.estado != 'programada'){
        return res.status(400).json({
            success: false,
            message: 'Solo se pueden cancelar citas en estado programada'
        })
    }
    const resultado = cancelarCita(id)
    if(!resultado){
        return res.status(404).json({
            success: false,
            message: 'ID no encontrado'
        })
    }
    return res.status(200).json({
        success: true,
        message: 'Cita cancelada exitosamente'
    })
})

app.get('/api/citas/doctor/:doctorId', (req, res) =>{
    const {doctorId} = req.params
    const citas = obtenerCitasDeDoctor(doctorId)
    return res.status(200).json({
        success: true,
        data: citas
    })
})  

/// Endpoint Estadisticas ///////

app.get('/api/estadisticas/doctores', (req, res) =>{    
    const doctorMasCitas = doctorConMasCitas()
    return res.status(200).json({
        success: true,
        data: doctorMasCitas
    })
})

app.get('/api/estadisticas/especialidades', (req, res) =>{    
    const especialidadSolicitada = especialidadMasSolicitada()
    return res.status(200).json({
        success: true,
        data: especialidadSolicitada
    })
})

//// Endpoint Busquedas Avanzadas ///////

// app.get('/api/citas', (req, res) => {
//   const { fecha, estado } = req.query;
//   console.log('Parámetros recibidos:', { fecha, estado })
//   if (!fecha || !estado) {
//     return res.status(400).json({
//       success: false,
//       message: 'Debes proporcionar ambos parámetros: fecha y estado'
//     });
//   }

//   const citas = buscarCitasPorFechaYEstado(fecha, estado);
//   return res.status(200).json({
//     success: true,
//     data: citas
//   });
// });

app.get('/api/buscar/doctores/disponibles', (req, res) => {
    let { fecha, hora } = req.query;
    
    // Si no envían fecha, usar la fecha actual
    if (!fecha) {
        const hoy = new Date();
        fecha = hoy.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
    }
    
    // Si no envían hora, usar la hora actual
    if (!hora) {
        const ahora = new Date();
        const horas = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        hora = `${horas}:${minutos}`; // Formato: HH:MM
    }
    
    const doctoresDisponibles = buscarDoctoresDisponibles(fecha, hora);
    
    return res.status(200).json({
        success: true,
        data: doctoresDisponibles,
        fecha: fecha,
        hora: hora
    });
});
//// Endpoint Notificaciones ///////

app.get('/api/notificaciones/citas-proximas', (req, res) =>{    
    const citasProximas = citasProximas24Horas()
    return res.status(200).json({
        success: true,
        data: citasProximas
    })
})


app.listen(port, ()=>{
    console.log(`Servidor escuchando en http://localhost:${port}`)
})