const getFechaHoraPST = () => {
    const now = new Date();
    
    // Opciones para obtener la fecha en formato ISO (YYYY-MM-DD)
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Los_Angeles' // Forzamos la zona horaria PST/PDT
    };

    // Obtenemos la fecha en el formato 'MM/DD/YYYY' en la zona horaria especificada
    const dateParts = now.toLocaleDateString('en-US', options).split('/');
    
    // Reordenamos a 'YYYY-MM-DD'
    const hoyPST = `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`;

    // Creamos un objeto Date que represente el momento PST
    // Para el objeto 'ahora' (que se usa en el endpoint de 24h) podemos usar un enfoque más simple.
    // Usaremos el objeto now, pero es importante que el backend sepa que la hora 'hoy' ya fue calculada.
    const nowPST = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));

    return { 
        hoy: hoyPST, 
        ahora: nowPST 
    };
};


// -------------------------------------------------------------
// FUNCIÓN 1: MANEJO DEL ENVÍO DE FORMULARIOS (POST)
// -------------------------------------------------------------
const handleSubmit = async (e) => {
    e.preventDefault(); 

    const form = e.target; 
    const formId = form.id;
    let datosAEnviar = {};
    let endpoint = '';
    const mensajeEstado = form.querySelector('#mensaje-estado');

    // Limpieza de mensajes antes de enviar
    mensajeEstado.className = 'mensaje-oculto';
    mensajeEstado.textContent = '';
    
    // --- Lógica de Extracción de Datos Específica ---

    if (formId === 'registroPacienteForm') {
        endpoint = '/api/pacientes';
        const nombre = document.getElementById('nombre').value;
        const edad = parseInt(document.getElementById('edad').value); 
        const telefono = document.getElementById('telefono').value;
        const email = document.getElementById('email').value;
        datosAEnviar = { nombre, edad, telefono, email };

    } else if (formId === 'registroDoctorForm') {
        endpoint = '/api/doctores';
        const nombre = document.getElementById('nombreDoctor').value;
        const especialidad = document.getElementById('especialidad').value;
        const horarioInicio = document.getElementById('horarioInicio').value;
        const horarioFin = document.getElementById('horarioFin').value;
        
        const checkboxes = form.querySelectorAll('input[name="diasDisponibles"]:checked');
        const diasDisponibles = Array.from(checkboxes).map(cb => cb.value);

        datosAEnviar = { nombre, especialidad, horarioInicio, horarioFin, diasDisponibles };
    
    } else if (formId === 'registroCitaForm') {
        endpoint = '/api/citas';
        
        const pacienteId = document.getElementById('pacienteId').value;
        const doctorId = document.getElementById('doctorId').value;
        const fecha = document.getElementById('fecha').value;
        const hora = document.getElementById('hora').value;
        const motivo = document.getElementById('motivo').value;
        const estado = document.getElementById('estado').value; 
        
        datosAEnviar = { pacienteId, doctorId, fecha, hora, motivo, estado };
    } else {
        return;
    }

    // --- Lógica Común de Fetch ---
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosAEnviar)
        });

        const resultado = await response.json();
        mensajeEstado.style.display = 'block';

        if (response.ok) { 
            mensajeEstado.classList.add('mensaje-exito');
            mensajeEstado.textContent = `¡Registro exitoso! ID: ${resultado.data.id}`;
            form.reset(); 
            
        } else { 
            mensajeEstado.classList.add('mensaje-error');
            mensajeEstado.textContent = `Error: ${resultado.message}`;
        }

    } catch (error) {
        mensajeEstado.classList.add('mensaje-error');
        mensajeEstado.textContent = 'Error de conexión con el servidor. Asegúrate de que Express esté corriendo.';
        mensajeEstado.style.display = 'block';
        console.error('Error al enviar el formulario:', error);
    }
};

// -------------------------------------------------------------
// FUNCIÓN 2: CARGAR DATOS EN SELECTORES (GET)
// -------------------------------------------------------------
const cargarSelectores = async (selectId, endpoint, displayKey, valueKey) => {
    const select = document.getElementById(selectId);
    if (!select) return; 

    try {
        const response = await fetch(endpoint);
        const resultado = await response.json();

        if (resultado.success && Array.isArray(resultado.data)) {
            
            select.innerHTML = '<option value="">Seleccione...</option>';
            
            resultado.data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueKey]; 
                option.textContent = item[displayKey]; 
                select.appendChild(option);
            });
        } else {
            select.innerHTML = `<option value="">Error al cargar datos: ${resultado.message || 'Formato incorrecto'}</option>`;
        }

    } catch (error) {
        select.innerHTML = '<option value="">Error de conexión con el servidor.</option>';
        console.error(`Error al cargar ${selectId}:`, error);
    }
};

// -------------------------------------------------------------
// FUNCIÓN 3: CARGAR DATOS DEL DASHBOARD
// -------------------------------------------------------------
const cargarDashboard = async () => {
    
    const {hoy, ahora} = getFechaHoraPST();
    
    // Log de depuración: Muestra la fecha PST (YYYY-MM-DD) y el objeto Date (UTC)
    console.log(`FECHA PST CALCULADA POR BROWSER: ${hoy}, Objeto 'ahora': ${ahora.toISOString()}`);
    
    // Endpoints de Estadísticas
    const endpoints = [
        { id: 'card-pacientes', url: '/api/pacientes', countKey: 'data' },
        { id: 'card-doctores', url: '/api/doctores', countKey: 'data' },
        { id: 'card-citas-hoy', url: `/api/citas?fecha=${hoy}&estado=programada`, countKey: 'data' },
        // Enviamos el timestamp de 'ahora' para que el servidor calcule las 24h correctamente desde el momento PST
        { id: 'card-citas-24h', url: `/api/notificaciones/citas-proximas?ahora=${ahora.toISOString()}`, countKey: 'data' } 
    ];

    // --- Carga de Tarjetas de Estadísticas ---
    const cargarEstadisticas = async () => {
        try {
            const promises = endpoints.map(ep => fetch(ep.url).then(res => res.json()));
            const resultados = await Promise.all(promises);

            resultados.forEach((res, index) => {
                const ep = endpoints[index];
                const card = document.getElementById(ep.id);
                
                if (card && res.success) {
                    const count = Array.isArray(res[ep.countKey]) ? res[ep.countKey].length : 0;
                    card.querySelector('.stat-value').textContent = count;
                }
            });
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };
    
    // --- Carga de Citas de Hoy (Tabla) ---
    const cargarTablaCitasHoy = async () => {
        // Usamos la fecha PST y el estado 'programada' para filtrar citas de hoy
        const citasHoyUrl = `/api/citas?fecha=${hoy}`; 
        const doctoresUrl = '/api/doctores';
        const pacientesUrl = '/api/pacientes';

        const tbody = document.querySelector('#citas-hoy-table tbody');
        tbody.innerHTML = '<tr><td colspan="5">Cargando citas...</td></tr>';

        try {
            const [citasRes, doctoresRes, pacientesRes] = await Promise.all([
                fetch(citasHoyUrl).then(res => res.json()),
                fetch(doctoresUrl).then(res => res.json()),
                fetch(pacientesUrl).then(res => res.json())
            ]);

            if (!citasRes.success || !doctoresRes.success || !pacientesRes.success) {
                throw new Error("Fallo al obtener datos del backend.");
            }

            const citas = citasRes.data;
            const doctoresMap = doctoresRes.data.reduce((map, d) => ({ ...map, [d.id]: d }), {});
            const pacientesMap = pacientesRes.data.reduce((map, p) => ({ ...map, [p.id]: p }), {});
            
            tbody.innerHTML = ''; 

            if (citas.length > 0) {
                citas.sort((a, b) => a.hora.localeCompare(b.hora));

                citas.forEach(cita => {
                    const row = tbody.insertRow();
                    
                    const paciente = pacientesMap[cita.pacienteId] || { nombre: 'N/A' };
                    const doctor = doctoresMap[cita.doctorId] || { nombre: 'N/A' };

                    let estadoClase = '';
                    const estadoLower = cita.estado.toLowerCase();
                    if (estadoLower === 'programada' || estadoLower === 'pendiente') {
                        estadoClase = 'estado-programada';
                    } else if (estadoLower === 'cancelada') {
                        estadoClase = 'estado-cancelada';
                    }

                    row.innerHTML = `
                        <td>${cita.hora}</td>
                        <td>${paciente.nombre}</td>
                        <td>${doctor.nombre}</td>
                        <td>${cita.motivo}</td>
                        <td><span class="${estadoClase}">${cita.estado}</span></td>
                    `;
                });
            } else {
                const row = tbody.insertRow();
                row.innerHTML = `<td colspan="5" style="text-align:center; color:#555;">No hay citas programadas para hoy.</td>`;
            }
        } catch (error) {
            console.error('Error al cargar la tabla de citas:', error);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error al cargar datos.</td></tr>`;
        }
    };
    
    cargarEstadisticas();
    cargarTablaCitasHoy();
};


// -------------------------------------------------------------
// INICIALIZACIÓN Y ASIGNACIÓN DE EVENTOS
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // Asignar el manejador de envío a todos los formularios
    const formPaciente = document.getElementById('registroPacienteForm');
    const formDoctor = document.getElementById('registroDoctorForm');
    const formCita = document.getElementById('registroCitaForm');

    if (formPaciente) formPaciente.addEventListener('submit', handleSubmit);
    if (formDoctor) formDoctor.addEventListener('submit', handleSubmit);
    
    if (formCita) {
        formCita.addEventListener('submit', handleSubmit);
        
        // Cargar los selectores al abrir el formulario de citas
        cargarSelectores(
            'pacienteId', 
            '/api/pacientes', 
            'nombre', 
            'id'       
        );
        cargarSelectores(
            'doctorId', 
            '/api/doctores', 
            'nombre', 
            'id'       
        );
    }

    // Lógica de carga del dashboard
    if (document.querySelector('.dashboard-grid')) {
        cargarDashboard();
    }
});