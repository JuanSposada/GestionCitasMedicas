// --- CONSTANTES Y ESTADO GLOBAL ---
const API_BASE_URL = '/api';

// Almacena todas las citas brutas obtenidas del servidor para este doctor
let ALL_APPOINTMENTS = [];
/**
 * Muestra mensajes de estado (éxito o error) en el formulario.
 * Esta función es necesaria porque en tu handleSubmit estás usando clases de CSS 
 * 'mensaje-exito', 'mensaje-error', y 'mensaje-oculto' directamente en el elemento.
 * * @param {string} texto - El mensaje a mostrar.
 * @param {string} tipo - 'success' o 'error'.
 * @param {HTMLFormElement} form - El formulario que contiene el elemento #mensaje-estado.
 */
const mostrarMensaje = (texto, tipo, form) => {
    // Busca el elemento de mensaje dentro del formulario actual
    const mensajeEstado = form.querySelector('#mensaje-estado');

    if (mensajeEstado) {
        // 1. Limpiar estilos y clases anteriores
        mensajeEstado.classList.remove('mensaje-oculto', 'mensaje-exito', 'mensaje-error');
        mensajeEstado.style.display = 'block';

        // 2. Aplicar el nuevo estilo y texto
        mensajeEstado.textContent = texto;

        if (tipo === 'success') {
            mensajeEstado.classList.add('mensaje-exito');
        } else {
            // Asume 'error' o cualquier otro tipo
            mensajeEstado.classList.add('mensaje-error');
        }
    } else {
        console.error(`ERROR: No se encontró el elemento #mensaje-estado en el formulario ${form.id}.`);
    }
};

/**
 * Realiza la validación de los días disponibles para el formulario de Doctor.
 * @param {HTMLFormElement} form - El formulario a validar.
 * @returns {boolean} True si al menos un día está seleccionado, false en caso contrario.
 */
const validarDoctor = (form) => {
    const diasCheckboxes = form.elements['diasDisponibles'];
    
    // Debe seleccionar al menos un día disponible
    let diaSeleccionado = false;
    for (let i = 0; i < diasCheckboxes.length; i++) {
        if (diasCheckboxes[i].checked) {
            diaSeleccionado = true;
            break;
        }
    }

    if (!diaSeleccionado) {
        mostrarMensaje('Debe seleccionar al menos un día disponible.', 'error', form);
        return false;
    }
    
    return true;
};

// Función para obtener el valor de un parámetro de la URL (por ejemplo, 'id')
const obtenerParametroURL = (nombre) => {
    // Escapa caracteres especiales en el nombre del parámetro
    nombre = nombre.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    // Crea una expresión regular para buscar el parámetro
    const regex = new RegExp("[\\?&]" + nombre + "=([^&#]*)");
    // Ejecuta la búsqueda en la cadena de consulta de la URL (lo que va después del ?)
    const results = regex.exec(location.search);
    // Si encuentra el resultado, lo decodifica y lo devuelve. Si no, devuelve null.
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
};


// =========================================================
// FUNCIÓN AUXILIAR: CALCULAR FECHA/HORA en PST (UTC-8)
// =========================================================
/**
 * Calcula la fecha y hora actual ajustadas a la zona horaria PST (UTC-8).
 * Usa la internacionalización para forzar el cálculo de la fecha correcta en la zona horaria de Los Ángeles.
 * @returns {object} { hoy: 'YYYY-MM-DD' (fecha actual en PST), ahora: Date (objeto ajustado a PST) }
 */
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
    const nowPST = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));

    return { 
        hoy: hoyPST, 
        ahora: nowPST 
    };
};


const { hoy: TODAY_DATE_STRING_PST, ahora: NOW_PST } = getFechaHoraPST();
const TODAY_MIDNIGHT_PST = new Date(NOW_PST);
TODAY_MIDNIGHT_PST.setHours(0, 0, 0, 0); 

const dateToString = (date) => date.toISOString().split('T')[0];

/**
 * Calcula los rangos de fecha para los filtros preestablecidos.
 * Utiliza TODAY_MIDNIGHT_PST para iniciar los rangos.
 * @param {string} filterType - 'today', 'week', 'next7days' o una fecha específica.
 */
const getDateRange = (filterType) => {
    // Usamos el punto de inicio de hoy (medianoche PST)
    const start = new Date(TODAY_MIDNIGHT_PST);
    const end = new Date(TODAY_MIDNIGHT_PST);
    
    if (filterType === 'today') {
        end.setDate(end.getDate() + 1); // Rango: Hoy (00:00:00) a Mañana (00:00:00)
    } else if (filterType === 'week') {
        const day = start.getDay(); // 0 = Domingo, 6 = Sábado
        start.setDate(start.getDate() - day); // Ir al domingo
        end.setDate(start.getDate() + 7); // 7 días después del domingo
    } else if (filterType === 'next7days') {
        end.setDate(end.getDate() + 7); // Hoy hasta los próximos 7 días
    } else {
        // Si es un filtro personalizado de fecha (una string YYYY-MM-DD)
        return { isSingleDay: true, targetDate: filterType };
    }

    return { start: dateToString(start), end: dateToString(end) };
};

// --- FUNCIÓN 1: RENDERIZACIÓN DEL ENCABEZADO DEL DOCTOR ---

/**
 * Renderiza los detalles del doctor en el encabezado.
 * @param {Object} doctor - Objeto con los detalles del doctor.
 */
const renderDoctorHeader = (doctor) => {
    // Asumiendo que el objeto doctor tiene: nombre, especialidad, horario
    document.getElementById('doctor-name').textContent = `Agenda del Dr. ${doctor.nombre}`;
    document.getElementById('doctor-specialty').textContent = `Especialidad: ${doctor.especialidad}`;
    document.getElementById('doctor-schedule').textContent = `Horario: ${doctor.horario}`;
}


// --- FUNCIÓN 2: CARGAR DETALLES DEL DOCTOR ---

/**
 * Obtiene los detalles del doctor desde el servidor, usando obtenerParametroURL para el ID.
 */
const fetchDoctorDetails = async () => {
    // USO DEL CÓDIGO BASE: Obtener el ID dinámicamente
    const doctorId = obtenerParametroURL('id');
    if (!doctorId) {
        console.error("Error: El ID del doctor no se encontró en la URL (parámetro 'doctor_id').");
        return; 
    }
    console.log(`DEBUG: fetchDoctorDetails - Intentando cargar detalles para Doctor ID: ${doctorId}`);

    try {
        const url = `${API_BASE_URL}/doctores/${doctorId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
            renderDoctorHeader(result.data);
        } else {
            console.error("Respuesta del servidor no válida para doctor:", result);
            document.getElementById('doctor-name').textContent = 'Error al cargar datos del doctor';
        }

    } catch (error) {
        console.error("Error al obtener detalles del doctor:", error);
        document.getElementById('doctor-name').textContent = 'Error de conexión';
    }
}


// --- FUNCIÓN 3: RENDERIZACIÓN DE LA LISTA DE CITAS ---

/**
 * Renderiza la lista de citas en el DOM.
 * @param {Array<Object>} appointments - Citas a mostrar.
 */
const renderAppointments = (appointments) => {
    const listContainer = document.getElementById('appointments-list');
    listContainer.innerHTML = ''; // Limpiar lista anterior

    if (appointments.length === 0) {
        listContainer.innerHTML = '<div class="appointment-item details">No hay citas agendadas para este período.</div>';
        return;
    }

    appointments
        // Ordenar por fecha y luego por hora
        .sort((a, b) => {
            const dateA = new Date(`${a.fecha}T${a.hora}`);
            const dateB = new Date(`${b.fecha}T${b.hora}`);
            return dateA - dateB;
        })
        .forEach(cita => {
            // Determinar clases CSS y contenido basado en el estado
            const isCancelled = cita.estado === 'cancelada';
            const statusClass = isCancelled ? 'cancelada' : 'programada';
            // Icono de X para canceladas, Check para programadas
            const iconContent = isCancelled 
                ? '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'
                : '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>';

            const appointmentElement = `
                <div class="appointment-item ${statusClass}">
                    <!-- Icono de Estado -->
                    <div class="icon-container">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            ${iconContent}
                        </svg>
                    </div>
                    
                    <!-- Detalles de la Cita -->
                    <div class="flex-grow">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <p class="patient-name">${cita.pacienteId}</p>
                            <span class="status-pill">${cita.estado}</span>
                        </div>
                        <p class="details">Motivo: ${cita.motivo}</p>
                        <div class="time-info">
                            <span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                                ${cita.fecha}
                            </span>
                            <span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                ${cita.hora}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', appointmentElement);
        });
};


// --- FUNCIÓN 4: ACTUALIZACIÓN DE ESTADÍSTICAS ---

/**
 * Actualiza las tarjetas de estadísticas con los totales.
 * @param {Array<Object>} allAppointments - El conjunto completo de citas.
 */
const updateStats = (allAppointments) => {
    const programmed = allAppointments.filter(c => c.estado === 'programada').length;
    const cancelled = allAppointments.filter(c => c.estado === 'cancelada').length;
    const total = allAppointments.length;

    document.getElementById('total-programmed').textContent = programmed;
    document.getElementById('total-cancelled').textContent = cancelled;
    document.getElementById('total-appointments').textContent = total;
};


// --- FUNCIÓN 5: MANEJO VISUAL DE BOTONES DE FILTRO ---

/**
 * Marca visualmente el botón de filtro activo.
 * @param {string} filterType - Tipo de filtro ('today', 'week', 'next7days').
 */
const setActiveFilterButton = (filterType) => {
    document.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeButton = document.getElementById(`filter-${filterType}`);
    if (activeButton) {
        activeButton.classList.add('active');
        document.getElementById('date-filter').value = ''; // Limpiar fecha si se usa un pre-set
    }
}

// --- FUNCIÓN 6: CARGA INICIAL DE TODAS LAS CITAS ---

/**
 * Obtiene todas las citas del doctor desde el servidor, usando obtenerParametroURL para el ID.
 */
const fetchAllAppointments = async () => {
    // USO DEL CÓDIGO BASE: Obtener el ID dinámicamente
    const doctorId = obtenerParametroURL('id');
    if (!doctorId) {
        console.error("Error: El ID del doctor no se encontró en la URL (parámetro 'doctor_id').");
        return; 
    }
    console.log(`DEBUG: fetchDoctorDetails - Intentando cargar detalles para Doctor ID: ${doctorId}`);

    // Usamos un simple cargador visual mientras se hace el fetch
    document.getElementById('appointments-list').innerHTML = '<div class="appointment-item programada details">Cargando agenda...</div>';
    
    try {
        const url = `${API_BASE_URL}/citas/doctor/${doctorId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            ALL_APPOINTMENTS = result.data;
            // Después de cargar, aplicamos el filtro por defecto (Hoy)
            filterAppointments('today'); 
        } else {
            console.error("Respuesta del servidor no válida:", result);
            document.getElementById('appointments-list').innerHTML = '<div class="appointment-item cancelada details">Error al cargar la agenda. Formato de datos incorrecto.</div>';
        }

    } catch (error) {
        console.error("Error al obtener citas:", error);
        document.getElementById('appointments-list').innerHTML = '<div class="appointment-item cancelada details">Error de conexión con el servidor. Intente más tarde.</div>';
    }
}


// --- FUNCIÓN 7: LÓGICA DE FILTRADO PRINCIPAL ---

/**
 * Filtra las citas basándose en el tipo de filtro o rango de fecha.
 * @param {string} filterType - Tipo de filtro ('today', 'week', 'next7days') o fecha específica (YYYY-MM-DD).
 */
const filterAppointments = (filterType) => {
    // Las estadísticas siempre se basan en el total de citas del doctor
    updateStats(ALL_APPOINTMENTS); 

    const range = getDateRange(filterType);
    let filtered = [];
    
    // Lógica de filtrado: utiliza ALL_APPOINTMENTS obtenidas del servidor
    if (range.isSingleDay) {
        // Filtro por fecha específica
        filtered = ALL_APPOINTMENTS.filter(cita => cita.fecha === range.targetDate);
    } else {
        // Filtro por rango de fechas
        filtered = ALL_APPOINTMENTS.filter(cita => {
            return cita.fecha >= range.start && cita.fecha < range.end;
        });
    }

    renderAppointments(filtered);
    
    // Si es un filtro preestablecido, marcamos el botón activo
    if (['today', 'week', 'next7days'].includes(filterType)) {
        setActiveFilterButton(filterType);
    }
};


// --- FUNCIÓN 8: MANEJO DEL INPUT DE FECHA ---

/**
 * Maneja el cambio del input de fecha específico.
 * @param {string} dateString - Fecha seleccionada (YYYY-MM-DD).
 */
const filterByDate = (dateString) => {
    if (dateString) {
        // Establece el filtro en la fecha específica
        filterAppointments(dateString); 
        // Desactivar botones preestablecidos
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.remove('active');
        });
    }
}


// --- INICIALIZACIÓN ---

// Exponemos las funciones al ámbito global (window) para que el HTML pueda llamarlas directamente
window.filterAppointments = filterAppointments;
window.filterByDate = filterByDate;




// Variables globales para almacenar las listas completas (para el buscador)
let listaPacientes = []; 
let listaDoctores = []; 

// =========================================================
// FUNCIONES AUXILIARES PARA EL MODAL DE EDICIÓN
// (Asumimos que un modal existe con ID 'modal-edicion')
// =========================================================

/**
 * Muestra el modal de edición de pacientes.
 * @param {string} modalId - El ID del modal.
 */
const mostrarModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('modal-visible');
        modal.style.display = 'flex';
    }
};

/**
 * Oculta el modal de edición de pacientes.
 * @param {string} modalId - El ID del modal.
 */
const ocultarModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('modal-visible');
        modal.style.display = 'none';
    }
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
        // Asumiendo que el backend añade la fecha de registro
        datosAEnviar = { nombre, edad, telefono, email };

    } else if (formId === 'registroDoctorForm') {
        if (!validarDoctor(form)) {
            return; 
        }
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
        
        // Forzamos el estado inicial a 'programada' (en minúsculas)
        const estado = 'programada'; 
        
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
            // Recargar la lista de pacientes si es un registro de paciente
            if (formId === 'registroPacienteForm') cargarPacientes();
            
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
// -------------------------------------------------------------
// FUNCIÓN 1.5: MANEJO DE EDICIÓN DE PACIENTES (PUT)
// -------------------------------------------------------------
const handleEditPaciente = async (e) => {
    e.preventDefault(); 

    const form = e.target; 
    const mensajeEstado = form.querySelector('#mensaje-estado');
    
    mensajeEstado.className = 'mensaje-oculto';
    mensajeEstado.textContent = '';

    // Obtener el ID del campo oculto. Si está vacío, la carga inicial falló.
    const pacienteId = document.getElementById('pacienteId').value; 
    
    // 🛑 LOG 3: Verificar el ID antes de enviarlo
    console.log('LOG 3: ID recuperado del campo oculto para el PUT:', pacienteId); 

    // 🛑 COMPROBACIÓN CRÍTICA: DETENER SI EL ID ESTÁ VACÍO
    if (!pacienteId) {
        mensajeEstado.classList.remove('mensaje-oculto', 'mensaje-exito');
        mensajeEstado.classList.add('mensaje-error');
        mensajeEstado.textContent = 'ERROR FATAL: El ID del paciente no se cargó en el formulario. No se puede actualizar.';
        mensajeEstado.style.display = 'block';
        
        // 🛑 LOG 4: Muestra el endpoint fallido
        console.error('LOG 4: PUT cancelado. Endpoint incompleto:', `/api/pacientes/${pacienteId}`);
        return; // Detenemos el envío del PUT
    }

    const nombre = document.getElementById('nombre').value;
    const edad = parseInt(document.getElementById('edad').value); 
    const telefono = document.getElementById('telefono').value;
    const email = document.getElementById('email').value;

    const datosAEnviar = { nombre, edad, telefono, email };
    const endpoint = `/api/pacientes/${pacienteId}`; 
    
    console.log('LOG 5: Endpoint PUT final:', endpoint); // LOG Final antes del fetch

    // --- Lógica Común de Fetch ---
    try {
        const response = await fetch(endpoint, {
            method: 'PUT', // Usamos PUT para actualizar el recurso
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosAEnviar)
        });

        const resultado = await response.json();
        mensajeEstado.style.display = 'block';

        if (response.ok) { 
            mensajeEstado.classList.remove('mensaje-oculto', 'mensaje-error');
            mensajeEstado.classList.add('mensaje-exito');
            mensajeEstado.textContent = `¡Paciente ID ${pacienteId} actualizado exitosamente!`;
            
            // Si quieres que redirija automáticamente, descomenta la siguiente línea:
            // setTimeout(() => window.location.href = './pacientes.html', 1500);
            
        } else { 
            mensajeEstado.classList.remove('mensaje-oculto', 'mensaje-exito');
            mensajeEstado.classList.add('mensaje-error');
            mensajeEstado.textContent = `Error al actualizar: ${resultado.message}`;
        }

    } catch (error) {
        mensajeEstado.classList.remove('mensaje-oculto', 'mensaje-exito');
        mensajeEstado.classList.add('mensaje-error');
        mensajeEstado.textContent = 'Error de conexión con el servidor al intentar actualizar.';
        mensajeEstado.style.display = 'block';
        console.error('Error al editar el paciente:', error);
    }
};


// main.js - FUNCIÓN 1.7: MANEJO DE EDICIÓN DE DOCTORES (PUT)

const handleEditDoctor = async (e) => {
    e.preventDefault(); 
    const form = e.target; 
    const mensajeEstado = form.querySelector('#mensaje-estado');
    
    // 1. Limpieza inicial
    mostrarMensaje('', 'oculto', form); 

    const doctorId = document.getElementById('doctorId').value; 
    
    if (!doctorId) {
        mostrarMensaje('ERROR FATAL: El ID del doctor no se cargó. No se puede actualizar.', 'error', form);
        return;
    }
    
    // 2. Validación de Días Disponibles (reutilizamos la función ya creada)
    if (!validarDoctor(form)) {
        return; // Detiene el envío si falla la validación de días
    }
    
    // 3. Serialización de Datos
    const nombre = document.getElementById('nombreDoctor').value;
    const especialidad = document.getElementById('especialidad').value;
    const horarioInicio = document.getElementById('horarioInicio').value;
    const horarioFin = document.getElementById('horarioFin').value;

    const checkboxes = form.querySelectorAll('input[name="diasDisponibles"]:checked');
    const diasDisponibles = Array.from(checkboxes).map(cb => cb.value);

    const datosAEnviar = { nombre, especialidad, horarioInicio, horarioFin, diasDisponibles };
    const endpoint = `/api/doctores/${doctorId}`; 

    // 4. Lógica de Fetch (PUT)
    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosAEnviar)
        });

        const resultado = await response.json();

        if (response.ok) { 
            mostrarMensaje(`¡Doctor ID ${doctorId} actualizado exitosamente!`, 'success', form);
            // Opcional: Recargar la vista de doctores
            // setTimeout(() => window.location.href = './doctores.html', 1500);
            
        } else { 
            // Esto capturará los errores de unicidad (Nombre+Especialidad) y horario (Inicio < Fin)
            mostrarMensaje(`Error al actualizar: ${resultado.message}`, 'error', form);
        }

    } catch (error) {
        console.error('Error al editar el doctor:', error);
        mostrarMensaje('Error de conexión con el servidor al intentar actualizar.', 'error', form);
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
    
    console.log(`FECHA PST CALCULADA POR BROWSER: ${hoy}, Objeto 'ahora': ${ahora.toISOString()}`);
    
    // Endpoints de Estadísticas
    const endpoints = [
        { id: 'card-pacientes', url: '/api/pacientes', countKey: 'data' },
        { id: 'card-doctores', url: '/api/doctores', countKey: 'data' },
        { id: 'card-citas-hoy', url: `/api/citas?fecha=${hoy}`, countKey: 'data' }, 
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
                    let count = 0;
                    
                    if (ep.id === 'card-citas-hoy' && Array.isArray(res[ep.countKey])) {
                        // Filtramos para contar solo citas programadas o pendientes (activas)
                        count = res[ep.countKey].filter(cita => 
                            cita.estado.toLowerCase() === 'programada' || 
                            cita.estado.toLowerCase() === 'pendiente'
                        ).length;
                    } else {
                        // Conteo normal para pacientes/doctores/citas-24h
                        count = Array.isArray(res[ep.countKey]) ? res[ep.countKey].length : 0;
                    }
                    
                    card.querySelector('.stat-value').textContent = count;
                }
            });
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };
    
    // --- Carga de Citas de Hoy (Tabla) ---
    const cargarTablaCitasHoy = async () => {
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
            
            // Filtramos las citas para la tabla para solo mostrar 'programada' o 'pendiente'
            const citasActivasHoy = citas.filter(cita => 
                cita.estado.toLowerCase() === 'programada' || 
                cita.estado.toLowerCase() === 'pendiente'
            );
            
            tbody.innerHTML = ''; 

            if (citasActivasHoy.length > 0) {
                citasActivasHoy.sort((a, b) => a.hora.localeCompare(b.hora));

                citasActivasHoy.forEach(cita => {
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
                        <td data-label="Hora">${cita.hora}</td>
                        <td data-label="Paciente">${paciente.nombre}</td>
                        <td data-label="Doctor">${doctor.nombre}</td>
                        <td data-label="Motivo">${cita.motivo}</td>
                        <td data-label="Estado"><span class="${estadoClase}">${cita.estado}</span></td>
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
// FUNCIÓN 4: CARGAR DATOS DE PACIENTES (LISTADO)
// -------------------------------------------------------------
const cargarPacientes = async () => {
    const tbody = document.getElementById('pacientesTableBody');
    const searchInput = document.getElementById('pacienteSearch');
    // Si no encontramos el tbody, salimos (no estamos en la vista de pacientes)
    if (!tbody) return; 

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando lista de pacientes...</td></tr>';
    
    try {
        const response = await fetch('/api/pacientes');
        const resultado = await response.json();

        if (resultado.success && Array.isArray(resultado.data)) {
            listaPacientes = resultado.data; // Guardamos la lista completa
            renderizarTablaPacientes(listaPacientes);
            
            // Adjuntar listener para la búsqueda solo si no estaba ya
            if (searchInput && !searchInput.dataset.listener) {
                searchInput.addEventListener('keyup', filtrarPacientes);
                searchInput.dataset.listener = 'true'; // Marcamos que el listener ha sido agregado
            }
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Error al cargar datos: ${resultado.message || 'Formato incorrecto'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error al cargar la tabla de pacientes:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Error de conexión con el servidor.</td></tr>`;
    }
};

/**
 * Filtra la lista de pacientes y renderiza la tabla.
 */
const filtrarPacientes = () => {
    const searchInput = document.getElementById('pacienteSearch');
    const searchTerm = searchInput.value.toLowerCase();
    
    const pacientesFiltrados = listaPacientes.filter(paciente => 
        paciente.nombre.toLowerCase().includes(searchTerm) || 
        paciente.id.toLowerCase().includes(searchTerm) ||
        paciente.email.toLowerCase().includes(searchTerm)
    );
    
    renderizarTablaPacientes(pacientesFiltrados);
};

/**
 * Renderiza los pacientes en el cuerpo de la tabla.
 * @param {Array<Object>} pacientes - Lista de pacientes a renderizar.
 */
const renderizarTablaPacientes = (pacientes) => {
    const tbody = document.getElementById('pacientesTableBody');
    tbody.innerHTML = '';
    
    if (pacientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No se encontraron pacientes.</td></tr>';
        return;
    }

    pacientes.forEach(paciente => {
        const row = tbody.insertRow();
        
        // Asumiendo que el backend añade 'fechaRegistro' o usamos 'N/A' si no existe
        const fechaRegistro = paciente.fechaRegistro || 'N/A'; 

        row.innerHTML = `
            <td data-label="ID">${paciente.id}</td>
            <td data-label="Nombre">${paciente.nombre}</td>
            <td data-label="Edad">${paciente.edad}</td>
            <td data-label="Teléfono">${paciente.telefono}</td>
            <td data-label="Email">${paciente.email}</td>
            <td data-label="Fecha">${fechaRegistro}</td>
            <td data-label="Acciones" class="action-buttons">
                <button class="btn-history" onclick="window.location.href = 'historialPaciente.html?id=${paciente.id}'">Historial</button>
                <button class="btn-edit" onclick="window.location.href = 'editarPaciente.html?id=${paciente.id}'">Editar</button>
                <button class="btn-delete" onclick="console.log('Funcionalidad de Eliminación para ID: ${paciente.id}')">Eliminar</button>
            </td>
        `;
    });
};

// -------------------------------------------------------------
// FUNCIÓN 4.5: CARGAR DATOS EN EL MODAL DE EDICIÓN
// -------------------------------------------------------------
/**
 * Busca un paciente y pre-llena el formulario de edición en el modal.
 * @param {string} pacienteId - El ID del paciente a editar.
 */
const abrirModalEdicionPaciente = (pacienteId) => {
    // 1. Buscar al paciente en la lista cargada globalmente
    const paciente = listaPacientes.find(p => p.id === pacienteId);

    if (!paciente) {
        console.error(`Paciente con ID ${pacienteId} no encontrado.`);
        return;
    }
    
    // 2. Limpiar mensajes de estado anteriores
    const mensajeEstado = document.querySelector('#editarPacienteForm #mensaje-estado-edicion');
    if (mensajeEstado) {
        mensajeEstado.className = 'mensaje-oculto';
        mensajeEstado.textContent = '';
    }

    // 3. Llenar los campos del formulario de edición (asumiendo IDs específicos)
    document.getElementById('pacienteIdEdit').value = paciente.id; // Campo oculto para el ID
    document.getElementById('nombreEdit').value = paciente.nombre;
    document.getElementById('edadEdit').value = paciente.edad;
    document.getElementById('telefonoEdit').value = paciente.telefono;
    document.getElementById('emailEdit').value = paciente.email;

    // 4. Mostrar el modal (asumiendo ID del modal)
    mostrarModal('modal-edicion');
};


// -------------------------------------------------------------
// FUNCIÓN 5: CARGAR DATOS DE DOCTORES (LISTADO)
// -------------------------------------------------------------
// main.js - Modificación de cargarDoctores

// Añadimos 'filtroEspecialidad' como parámetro opcional
const cargarDoctores = async (filtroEspecialidad = 'todas') => { 
    // Nota: El elemento 'doctoresTableBody' solo existe en vistas/doctores.html
    const tbody = document.getElementById('doctoresTableBody');
    const searchInput = document.getElementById('doctorSearch');
    
    if (!tbody) return; 
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando lista de doctores...</td></tr>';
    
    try {
        const response = await fetch('/api/doctores');
        const resultado = await response.json();

        if (resultado.success && Array.isArray(resultado.data)) {
            // Guardamos la lista completa para el filtro de búsqueda/especialidad
            listaDoctores = resultado.data; 
            cargarOpcionesEspecialidad(listaDoctores);
            
            // 🛑 NUEVA LÓGICA DE FILTRADO DE ESPECIALIDAD AL CARGAR 🛑
            let doctoresFiltrados = listaDoctores;
            
            if (filtroEspecialidad !== 'todas') {
                doctoresFiltrados = listaDoctores.filter(doc => 
                    doc.especialidad.toLowerCase() === filtroEspecialidad.toLowerCase()
                );
            }
            // -------------------------------------------------------------
            
            renderizarTablaDoctores(doctoresFiltrados);
            
            // Llenar el dropdown de especialidades si existe (ver sección 3)
            // cargarOpcionesEspecialidad(listaDoctores); 
            
            // Lógica del listener de búsqueda (se mantiene)
            if (searchInput && !searchInput.dataset.listener) {
                searchInput.addEventListener('keyup', filtrarDoctores);
                searchInput.dataset.listener = 'true';
            }
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar datos: ${resultado.message || 'Formato incorrecto'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error al cargar la tabla de doctores:', error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error de conexión con el servidor.</td></tr>`;
    }
};

// main.js - Función de validación simplificada


/**
 * Filtra la lista de doctores y renderiza la tabla.
 */
const filtrarDoctores = () => {
    const searchInput = document.getElementById('doctorSearch');
    const searchTerm = searchInput.value.toLowerCase();
    
    const doctoresFiltrados = listaDoctores.filter(doctor => 
        doctor.nombre.toLowerCase().includes(searchTerm) || 
        doctor.id.toLowerCase().includes(searchTerm) ||
        doctor.especialidad.toLowerCase().includes(searchTerm)
    );
    
    renderizarTablaDoctores(doctoresFiltrados);
};

/**
 * Renderiza los doctores en el cuerpo de la tabla.
 * @param {Array<Object>} doctores - Lista de doctores a renderizar.
 */
const renderizarTablaDoctores = (doctores) => {
    const tbody = document.getElementById('doctoresTableBody');
    tbody.innerHTML = '';
    
    if (doctores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron doctores.</td></tr>';
        return;
    }

    doctores.forEach(doctor => {
        const row = tbody.insertRow();
        
        // Manejo de valores si son undefined
        const horario = `${doctor.horarioInicio || '--'} - ${doctor.horarioFin || '--'}`;
        const dias = doctor.diasDisponibles ? doctor.diasDisponibles.join(', ') : 'No especificado';

        row.innerHTML = `
            <td data-label="ID">${doctor.id}</td>
            <td data-label="Nombre">${doctor.nombre}</td>
            <td data-label="Especialidad">${doctor.especialidad || 'N/A'}</td>
            <td data-label="Horario">${horario}</td>
            <td data-label="Días">${dias}</td>
            <td data-label="Acciones" class="action-buttons">
                <button class="btn-history" onclick="window.location.href = 'agendaDoctor.html?id=${doctor.id}'">Ver Agenda</button>
                <button class="btn-edit" onclick="window.location.href = 'editarDoctor.html?id=${doctor.id}'">Editar</button>
                <button class="btn-delete" onclick="handleDeleteDoctor('${doctor.id}')">Eliminar</button>
            </td>
        `;
    });
};

// main.js - Nueva función para cargar las opciones del filtro

/**
 * Llena el dropdown de especialidades con valores únicos de la lista de doctores.
 * @param {Array<Object>} doctores - Lista completa de doctores.
 */
const cargarOpcionesEspecialidad = (doctores) => {
    const filtroSelect = document.getElementById('especialidadFilter');
    if (!filtroSelect) return;

    // 1. Obtener especialidades únicas
    const especialidadesUnicas = new Set();
    doctores.forEach(doctor => {
        if (doctor.especialidad) {
            especialidadesUnicas.add(doctor.especialidad.trim());
        }
    });

    // 2. Limpiar opciones anteriores (dejando solo la opción "Todas")
    filtroSelect.innerHTML = '<option value="todas">Todas las Especialidades</option>';

    // 3. Añadir las nuevas opciones
    especialidadesUnicas.forEach(especialidad => {
        const option = document.createElement('option');
        option.value = especialidad;
        option.textContent = especialidad;
        filtroSelect.appendChild(option);
    });
};
// -------------------------------------------------------------
// FUNCIÓN 6: CARGAR DATOS DEL PACIENTE EN LA VISTA DE EDICIÓN (GET por ID)
// -------------------------------------------------------------
const cargarDatosEdicionPaciente = async () => {
    // 1. Obtener el ID del paciente de la URL
    console.log('LOG 0: Función cargarDatosEdicionPaciente iniciada.');
    const pacienteId = obtenerParametroURL('id');
    console.log('LOG 1: ID leído de la URL:', pacienteId);
    const form = document.getElementById('edicionPacienteForm');
    const headerStatus = document.getElementById('form-header-status');
    const mensajeEstado = document.getElementById('mensaje-estado');

    // Ocultamos el formulario y limpiamos mensajes mientras cargamos
    if (form) form.style.display = 'none'; 
    if (mensajeEstado) mensajeEstado.className = 'mensaje-oculto';

    if (!pacienteId) {
        console.error('ID de paciente no encontrado en la URL.');
        if (headerStatus) headerStatus.textContent = 'Error: ID de paciente no proporcionado.';
        return;
    }

    if (headerStatus) headerStatus.textContent = `Cargando datos para ID: ${pacienteId}...`;
    
    try {
        // 2. Obtener los datos del paciente desde el backend
        // Asume que tienes un endpoint GET /api/pacientes/:id
        const endpoint = `/api/pacientes/${pacienteId}`;
        const response = await fetch(endpoint);
        const resultado = await response.json();

        if (response.ok && resultado.success && resultado.data) {
            const paciente = resultado.data;
            
            // 3. Rellenar los campos del formulario con los IDs del HTML
            document.getElementById('pacienteId').value = paciente.id;
            document.getElementById('nombre').value = paciente.nombre;
            document.getElementById('edad').value = paciente.edad;
            document.getElementById('telefono').value = paciente.telefono;
            document.getElementById('email').value = paciente.email;

            if (headerStatus) headerStatus.textContent = `Modifica los campos necesarios y guarda los cambios para ID: ${paciente.id}.`;
            if (form) form.style.display = 'block'; // Mostrar el formulario
            
        } else {
            console.error(`Error al obtener paciente ID ${pacienteId}:`, resultado.message);
            if (headerStatus) headerStatus.textContent = `Error al cargar datos del paciente: ${resultado.message || 'Paciente no encontrado'}.`;
        }

    } catch (error) {
        console.error('Error de conexión al cargar datos del paciente:', error);
        if (headerStatus) headerStatus.textContent = 'Error de conexión con el servidor.';
    }
};
// main.js - FUNCIÓN 6.5: CARGAR DATOS DEL DOCTOR EN LA VISTA DE EDICIÓN (GET por ID)

const cargarDatosEdicionDoctor = async () => {
    const doctorId = obtenerParametroURL('id');
    const form = document.getElementById('edicionDoctorForm');
    const headerStatus = document.getElementById('form-header-status');
    const mensajeEstado = document.getElementById('mensaje-estado');

    if (form) form.style.display = 'none'; 
    if (mensajeEstado) mensajeEstado.classList.add('mensaje-oculto');

    if (!doctorId) {
        console.error('ID de doctor no encontrado en la URL.');
        if (headerStatus) headerStatus.textContent = 'Error: ID de doctor no proporcionado.';
        return;
    }

    if (headerStatus) headerStatus.textContent = `Cargando datos para ID: ${doctorId}...`;
    
    try {
        const endpoint = `/api/doctores/${doctorId}`;
        const response = await fetch(endpoint);
        const resultado = await response.json();

        if (response.ok && resultado.success && resultado.data) {
            const doctor = resultado.data;
            
            // 1. Rellenar campos simples
            document.getElementById('doctorId').value = doctor.id; // Campo oculto
            document.getElementById('nombreDoctor').value = doctor.nombre;
            document.getElementById('especialidad').value = doctor.especialidad;
            document.getElementById('horarioInicio').value = doctor.horarioInicio;
            document.getElementById('horarioFin').value = doctor.horarioFin;
            
            // 2. Rellenar Checkboxes de Días Disponibles
            if (Array.isArray(doctor.diasDisponibles)) {
                const checkboxes = form.querySelectorAll('input[name="diasDisponibles"]');
                checkboxes.forEach(cb => {
                    // Marcar si el valor del checkbox está en el array de días disponibles
                    if (doctor.diasDisponibles.includes(cb.value)) {
                        cb.checked = true;
                    } else {
                        cb.checked = false; // Asegurar que los no incluidos estén desmarcados
                    }
                });
            }

            if (headerStatus) headerStatus.textContent = `Modifica los campos necesarios y guarda los cambios para ID: ${doctor.id}.`;
            if (form) form.style.display = 'block'; 
            
        } else {
            console.error(`Error al obtener doctor ID ${doctorId}:`, resultado.message);
            if (headerStatus) headerStatus.textContent = `Error al cargar datos del doctor: ${resultado.message || 'Doctor no encontrado'}.`;
        }

    } catch (error) {
        console.error('Error de conexión al cargar datos del doctor:', error);
        if (headerStatus) headerStatus.textContent = 'Error de conexión con el servidor.';
    }
};
// -------------------------------------------------------------
// FUNCIÓN 7: CARGAR HISTORIAL DE CITAS DE UN PACIENTE (GET por ID y Citas)
// -------------------------------------------------------------
const cargarHistorialCitas = async (estadoFiltro = 'todas') => {
    const pacienteId = obtenerParametroURL('id');
    const headerInfo = document.getElementById('paciente-header-info');
    const tbody = document.getElementById('citas-tbody');
    const sinCitasMsg = document.getElementById('sin-citas-msg');
    
    // Limpiar tabla y ocultar mensaje
    tbody.innerHTML = '';
    sinCitasMsg.classList.add('mensaje-oculto');
    
    if (!pacienteId) {
        headerInfo.textContent = 'Error: ID de paciente no especificado.';
        return;
    }

    // 1. OBTENER DATOS DEL PACIENTE (para el header)
    try {
        const pacienteResponse = await fetch(`/api/pacientes/${pacienteId}`);
        const pacienteResult = await pacienteResponse.json();

        if (pacienteResult.success && pacienteResult.data) {
            const p = pacienteResult.data;
            headerInfo.textContent = `Paciente: ${p.nombre} (ID: ${p.id})`;
        } else {
            headerInfo.textContent = 'Paciente no encontrado.';
            // Si el paciente no se encuentra, no se intenta buscar citas
            return; 
        }

    } catch (error) {
        console.error('Error al cargar datos del paciente:', error);
        headerInfo.textContent = 'Error de conexión al cargar datos.';
        return;
    }

    // 2. OBTENER CITAS DEL PACIENTE
    try {
        // En tu backend, este endpoint debe retornar la lista de citas de ese paciente
        const citasResponse = await fetch(`/api/pacientes/${pacienteId}/historial`); 
        const citasResult = await citasResponse.json();

        if (citasResult.success && Array.isArray(citasResult.data)) {
            let citas = citasResult.data;
            
            // Aplicar filtro
            if (estadoFiltro !== 'todas') {
                citas = citas.filter(cita => cita.estado.toLowerCase() === estadoFiltro);
            }

            if (citas.length === 0) {
                sinCitasMsg.classList.remove('mensaje-oculto');
                return;
            }

            // Llenar la tabla
           citas.forEach(cita => {
                
                // 🛑 CORRECCIÓN: Leer los campos 'fecha' y 'hora' directamente 🛑
                const fecha = cita.fecha || 'N/A';
                
                // Usamos cita.hora.substring(0, 5) para mostrar solo HH:MM
                const horaMostrar = cita.hora ? cita.hora.substring(0, 5) : 'N/A'; 
                
                const row = tbody.insertRow();
                
                // Usamos las variables leídas directamente
                row.insertCell().textContent = fecha;
                row.insertCell().textContent = horaMostrar; 
                
                // ... (el resto de las celdas)
                row.insertCell().textContent = cita.doctorId || 'Desconocido';
                row.insertCell().textContent = cita.especialidad || 'General';
                row.insertCell().textContent = cita.motivo || 'N/A';
                row.insertCell().textContent = cita.estado;
                
                row.classList.add(`estado-${cita.estado.toLowerCase()}`);
            });
        } else {
            sinCitasMsg.classList.remove('mensaje-oculto');
        }

    } catch (error) {
        console.error('Error al cargar historial de citas:', error);
        sinCitasMsg.textContent = 'Error de conexión al cargar citas.';
        sinCitasMsg.classList.remove('mensaje-oculto');
    }
};


// --- FUNCIÓN 9: LLAMADA INICIAL DE CARGA ---

window.onload = () => {
    console.log("DEBUG: Página cargada. Iniciando carga de datos del doctor y citas.");
    // 1. Cargar la información del doctor
    fetchDoctorDetails();
    // 2. Cargar las citas del doctor
    fetchAllAppointments();
};
// -------------------------------------------------------------
// INICIALIZACIÓN Y ASIGNACIÓN DE EVENTOS
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // Asignar el manejador de envío a los formularios de registro (POST)
    const formPaciente = document.getElementById('registroPacienteForm');
    const formDoctor = document.getElementById('registroDoctorForm');
    const formCita = document.getElementById('registroCitaForm');
    
    // NUEVO: Asignar manejador de envío al formulario de edición (PUT)
    const formEdicionPaciente = document.getElementById('edicionPacienteForm');
    const formEdicionDoctor = document.getElementById('edicionDoctorForm');
    
    // Asignar listeners de registro (POST)
    if (formPaciente) formPaciente.addEventListener('submit', handleSubmit);
    if (formDoctor) formDoctor.addEventListener('submit', handleSubmit);
    
    // Asignar listener de edición (PUT)
    if (formEdicionPaciente) formEdicionPaciente.addEventListener('submit', handleEditPaciente);
    if (formEdicionDoctor) formEdicionDoctor.addEventListener('submit', handleEditDoctor);
    
    // Asignar listener para cerrar modal (si existe un botón de cierre)
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => ocultarModal('modal-edicion'));
    }
    
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

    // Lógica de carga de las vistas. Usamos IDs únicos para saber qué cargar.
    if (document.querySelector('.dashboard-grid')) {
        cargarDashboard();
    }
    
    // Lógica de carga de la vista de Pacientes
    if (document.getElementById('pacientes-list-view')) {
        cargarPacientes();
    }
    
    // Lógica de carga de la vista de Doctores 🛑 SE HA AMPLIADO ESTE BLOQUE 🛑
    const doctoresListView = document.getElementById('doctores-list-view');
    if (doctoresListView) {
        cargarDoctores();
        
        // 1. Listener para el filtro de especialidad (Nuevo requisito)
        const filtroSelect = document.getElementById('especialidadFilter');
        if (filtroSelect) {
            filtroSelect.addEventListener('change', (e) => {
                const especialidad = e.target.value;
                // Llama a la función de carga con el nuevo filtro
                cargarDoctores(especialidad); 
            });
            // Opcional: Llenar el dropdown de especialidades aquí si fuera necesario
        }

        // 2. Listener para la búsqueda (Se mantiene y se asocia a keyup en cargarDoctores)
        // El listener de 'keyup' para 'doctorSearch' ya está en la función cargarDoctores,
        // por lo que no es necesario duplicarlo aquí, ¡está perfecto!
    }
    // ---------------------------------------------------------------------

    // Lógica de carga para el formulario de Edición de Pacientes
    if (formEdicionPaciente) {
        console.log('LOG Carga: Ejecutando carga de datos para edición.');
        cargarDatosEdicionPaciente();
    }

    // Lógica de carga de la vista de Historial de Citas
    const historialView = document.getElementById('historial-citas-view');

    if (historialView) {
        cargarHistorialCitas(); // Cargar todas las citas al inicio

        // Asignar listener al selector de filtro
        const filtroSelect = document.getElementById('filtro-estado');
        if (filtroSelect) {
            filtroSelect.addEventListener('change', (e) => {
                const estado = e.target.value;
                cargarHistorialCitas(estado); // Recargar las citas con el nuevo filtro
            });
        }
    }
    if (formEdicionDoctor) {
        console.log('LOG Carga: Ejecutando carga de datos para edición de doctor.');
        cargarDatosEdicionDoctor();
    }
});