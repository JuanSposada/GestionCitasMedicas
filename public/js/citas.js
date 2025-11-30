// =========================================================
// ARCHIVO: main.js
// LÓGICA PARA GESTIÓN CENTRAL DE CITAS (citas.html)
// =========================================================

// --- CONSTANTES Y ESTADO GLOBAL ---
// Nota: Tu código previo ya define API_BASE_URL
const API_BASE_URL = '/api'; 

// Almacena todas las citas brutas obtenidas del servidor
let ALL_APPOINTMENTS = [];
// Almacena todos los doctores para el filtro
let ALL_DOCTORS = [];

let ALL_PATIENTS = []
// Elementos del DOM
const appointmentsTableBody = document.getElementById('appointments-table-body');
const filterStatusSelect = document.getElementById('filter-status');
const filterDateInput = document.getElementById('filter-date');
const filterDoctorSelect = document.getElementById('filter-doctor');
const noResultsMessage = document.getElementById('no-results-message');
const detailsModal = document.getElementById('details-modal');
const modalDetailsContent = document.getElementById('modal-details-content');


// ----------------------------------------------------------------------
// FUNCIONES AUXILIARES (del código previo, solo la necesaria para este contexto)
// ----------------------------------------------------------------------

/**
 * Muestra el modal de detalles o registro.
 * @param {string} modalId - El ID del modal.
 */
const mostrarModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.mostrarModal = mostrarModal;

/**
 * Oculta el modal de detalles o registro.
 * @param {string} modalId - El ID del modal.
 */
const ocultarModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};
// Expone la función al ámbito global para el HTML
window.ocultarModal = ocultarModal;


// -------------------------------------------------------------
// FUNCIÓN 1: CARGAR DOCTORES PARA EL FILTRO
// -------------------------------------------------------------

const fetchDoctorsForFilter = async () => {
    try {
        const url = `${API_BASE_URL}/doctores`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            ALL_DOCTORS = result.data;
            renderDoctorOptions(ALL_DOCTORS);
        } else {
            console.error("Respuesta del servidor no válida para doctores:", result);
        }

    } catch (error) {
        console.error("Error al obtener doctores:", error);
    }
}

/**
 * Renderiza las opciones de doctores en el select de filtro.
 * @param {Array<Object>} doctors - Lista de doctores.
 */
const renderDoctorOptions = (doctors) => {
    let optionsHtml = '<option value="all">Todos los Doctores</option>';
    
    doctors.forEach(doctor => {
        // Asume que el doctor tiene una propiedad 'id' y 'nombre'
        optionsHtml += `<option value="${doctor.id}">${doctor.nombre}</option>`;
    });

    filterDoctorSelect.innerHTML = optionsHtml;
};


// -------------------------------------------------------------
// FUNCIÓN 2: CARGA INICIAL DE TODAS LAS CITAS
// -------------------------------------------------------------

const fetchAllAppointments = async () => {
    appointmentsTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Cargando citas...</td></tr>';
    
    try {
        // Asumiendo que el endpoint '/citas' devuelve TODAS las citas.
        const url = `${API_BASE_URL}/citas`; 
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            ALL_APPOINTMENTS = result.data;
            // Inicialmente, filtramos y mostramos todas las citas.
            filterAppointments(); 
        } else {
            console.error("Respuesta del servidor no válida:", result);
            appointmentsTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: red;">Error al cargar la agenda. Formato de datos incorrecto.</td></tr>';
        }

    } catch (error) {
        console.error("Error al obtener citas:", error);
        appointmentsTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: red;">Error de conexión con el servidor. Intente más tarde.</td></tr>';
    }
}


// -------------------------------------------------------------
// FUNCIÓN 3: RENDERIZACIÓN DE LA TABLA DE CITAS
// -------------------------------------------------------------

/**
 * Renderiza la lista de citas en la tabla.
 * @param {Array<Object>} appointments - Citas a mostrar.
 */
const renderAppointmentsTable = (appointments) => {
    appointmentsTableBody.innerHTML = ''; // Limpiar lista anterior
    noResultsMessage.style.display = 'none';

    if (appointments.length === 0) {
        noResultsMessage.style.display = 'block';
        appointmentsTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay citas que coincidan con los filtros.</td></tr>';
        return;
    }

    appointments.forEach(cita => {
        // Buscar nombre del doctor (se asume que cita.doctorId tiene el ID del doctor)
        const doctor = ALL_DOCTORS.find(d => d.id == cita.doctorId) || { nombre: 'N/A', especialidad: 'N/A' };
        const paciente = ALL_PATIENTS.find(p => p.id == cita.pacienteId) || { nombre: 'N/A' };
        // Determinación de clases para el estado (pills)
        let statusClass = '';
        let buttonAction = '';
        let buttonText = '';
        let buttonDisabled = '';

        switch (cita.estado.toLowerCase()) {
            case 'programada':
                statusClass = 'status-programada';
                buttonAction = `showModalDetails('${cita.id}')`;
                buttonText = 'Detalles';
                buttonDisabled = '';
                break;
            case 'cancelada':
                statusClass = 'status-cancelada';
                buttonAction = `showModalDetails('${cita.id}')`;
                buttonText = 'Detalles';
                buttonDisabled = 'btn-disabled';
                break;
            case 'completada':
                statusClass = 'status-completada';
                buttonAction = `showModalDetails('${cita.id}')`;
                buttonText = 'Detalles';
                buttonDisabled = 'btn-disabled';
                break;
            default:
                statusClass = 'status-programada';
        }

        const rowHtml = `
            <tr data-appointment-id="${cita.id}">
                <td data-label="ID">${cita.id}</td>
                <td data-label="Fecha">${cita.fecha}</td>
                <td data-label="Hora">${cita.hora}</td>
                <td data-label="Paciente">${paciente.nombre}</td> 
                <td data-label="Doctor">${doctor.nombre}</td>
                <td data-label="Especialidad">${doctor.especialidad}</td>
                <td data-label="Motivo">${cita.motivo.substring(0, 30)}...</td>
                <td data-label="Estado"><span class="status-pill ${statusClass}">${cita.estado}</span></td>
                <td data-label="Acciones" class="action-buttons">
                    <button onclick="${buttonAction}" class="btn-details">Ver ${buttonText}</button>
                    <button onclick="cancelAppointment('${cita.id}')" class="btn-cancel ${cita.estado.toLowerCase() !== 'programada' ? 'btn-disabled' : ''}" ${cita.estado.toLowerCase() !== 'programada' ? 'disabled' : ''}>Cancelar</button>
                </td>
            </tr>
        `;
        appointmentsTableBody.insertAdjacentHTML('beforeend', rowHtml);
    });
};

// -------------------------------------------------------------
// FUNCIÓN 3.5: CARGAR PACIENTES
// -------------------------------------------------------------

const fetchAllPatients = async () => {
    try {
        const url = `${API_BASE_URL}/pacientes`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            ALL_PATIENTS = result.data;
            console.log(`DEBUG: Pacientes cargados: ${ALL_PATIENTS.length}`);
        } else {
            console.error("Respuesta del servidor no válida para pacientes:", result);
        }

    } catch (error) {
        console.error("Error al obtener pacientes:", error);
    }
}

// -------------------------------------------------------------
// FUNCIÓN 4: LÓGICA DE FILTRADO PRINCIPAL
// -------------------------------------------------------------

/**
 * Filtra las citas basándose en la Fecha, Estado y Doctor seleccionados.
 */
const filterAppointments = () => {
    const selectedDate = filterDateInput.value;
    const selectedStatus = filterStatusSelect.value;
    const selectedDoctorId = filterDoctorSelect.value;

    let filtered = ALL_APPOINTMENTS;
    
    // 1. Filtrar por Fecha
    if (selectedDate) {
        filtered = filtered.filter(cita => cita.fecha === selectedDate);
    }
    
    // 2. Filtrar por Estado
    if (selectedStatus !== 'all') {
        filtered = filtered.filter(cita => cita.estado.toLowerCase() === selectedStatus.toLowerCase());
    }

    // 3. Filtrar por Doctor
    if (selectedDoctorId !== 'all') {
        filtered = filtered.filter(cita => cita.doctorId == selectedDoctorId);
    }

    renderAppointmentsTable(filtered);
};


// -------------------------------------------------------------
// FUNCIÓN 5: LIMPIAR FILTROS
// -------------------------------------------------------------

const clearFilters = () => {
    filterDateInput.value = '';
    filterStatusSelect.value = 'all';
    filterDoctorSelect.value = 'all';
    filterAppointments(); // Vuelve a filtrar con los valores por defecto (todos)
};
// Expone la función al ámbito global para el HTML
window.clearFilters = clearFilters;


// -------------------------------------------------------------
// FUNCIÓN 6: MOSTRAR MODAL DE DETALLES DE CITA
// -------------------------------------------------------------
// --- CONSTANTES Y VARIABLES GLOBALES (al inicio de citas.js) ---
// ... (ALL_APPOINTMENTS, ALL_DOCTORS, ALL_PATIENTS, etc.)

// Elementos del DOM para detalles del modal
const modalCitaId = document.getElementById('modal-cita-id');
const detailsCita = document.getElementById('details-cita');
const detailsPaciente = document.getElementById('details-paciente');
const detailsDoctor = document.getElementById('details-doctor');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');

// -------------------------------------------------------------------
// FUNCIÓN PARA MOSTRAR DETALLES DE CITA
// -------------------------------------------------------------------
/**
 * Busca y muestra los detalles de una cita específica en el modal,
 * incluyendo los datos completos del paciente y doctor.
 * @param {number} appointmentId - ID de la cita a mostrar.
 */
const showModalDetails = (appointmentId) => {
    // 1. Obtener los objetos de la cita, doctor y paciente
    const cita = ALL_APPOINTMENTS.find(a => a.id == appointmentId);
    
    if (!cita) {
        alert('Cita no encontrada.');
        return;
    }

    // Usamos las listas cargadas previamente (ALL_DOCTORS y ALL_PATIENTS)
    const doctor = ALL_DOCTORS.find(d => d.id == cita.doctorId) || { nombre: 'N/A', especialidad: 'N/A', telefono: 'N/A' };
    // Se asume que ALL_PATIENTS tiene los campos: nombre, edad, telefono, email
    const paciente = ALL_PATIENTS.find(p => p.id == cita.pacienteId) || { nombre: 'N/A', edad: 'N/A', telefono: 'N/A', email: 'N/A' };

    // 2. Renderizar la información de la Cita
    const statusClass = cita.estado.toLowerCase().replace(' ', '');
    const citaHtml = `
        <h4 style="color: #007bff; margin-bottom: 5px;">Información de la Cita</h4>
        <p><strong>Estado:</strong> <span class="status-pill status-${statusClass}">${cita.estado}</span></p>
        <p><strong>Fecha y Hora:</strong> ${cita.fecha} a las ${cita.hora}</p>
        <p><strong>Motivo Completo:</strong> ${cita.motivo}</p>
    `;
    
    // 3. Renderizar la información del Paciente
    const pacienteHtml = `
        <h4 style="color: #28a745; margin-bottom: 5px;">Datos del Paciente</h4>
        <p><strong>Nombre:</strong> ${paciente.nombre}</p>
        <p><strong>Edad:</strong> ${paciente.edad} años</p>
        <p><strong>Teléfono:</strong> ${paciente.telefono || 'N/A'}</p>
        <p><strong>Email:</strong> ${paciente.email || 'N/A'}</p>
        <p><strong>ID del Sistema:</strong> ${cita.pacienteId}</p>
    `;

    // 4. Renderizar la información del Doctor
    const doctorHtml = `
        <h4 style="color: #17a2b8; margin-bottom: 5px;">Datos del Doctor</h4>
        <p><strong>Nombre:</strong> ${doctor.nombre}</p>
        <p><strong>Especialidad:</strong> ${doctor.especialidad}</p>
        <p><strong>Teléfono:</strong> ${doctor.telefono || 'N/A'}</p>
        <p><strong>ID del Sistema:</strong> ${cita.doctorId}</p>
    `;

    // 5. Inyectar en el DOM
    modalCitaId.textContent = `(#${cita.id})`;
    detailsCita.innerHTML = citaHtml;
    detailsPaciente.innerHTML = pacienteHtml;
    detailsDoctor.innerHTML = doctorHtml;

    // 6. Configurar el botón de Cancelar
    if (cita.estado.toLowerCase() === 'programada') {
        btnCancelarModal.style.display = 'inline-block';
        
        // **Lógica de Confirmación (¡Esto está bien!)**
        btnCancelarModal.onclick = () => {
            if (confirm(`¿Está seguro de cancelar la cita #${cita.id} con el Dr. ${doctor.nombre}? Esta acción es irreversible.`)) {
                // Asume que tienes una función `cancelAppointment(id)` definida.
                cancelAppointment(cita.id); 
                ocultarModal('details-modal'); // Cierra el modal
            }
        };
    } else {
        // Ocultar el botón si el estado no es 'programada'
        btnCancelarModal.style.display = 'none';
    }

    // 7. Mostrar el Modal
    mostrarModal('details-modal');
};

// Expone la función al ámbito global
window.showModalDetails = showModalDetails;

// Citas.js - FUNCIÓN 7: CANCELAR CITA (Implementación REAL)

/**
 * Envía una solicitud PUT para cambiar el estado de la cita a 'cancelada'
 * usando el endpoint específico de cancelación del servidor.
 * @param {string | number} appointmentId - ID de la cita a cancelar.
 */
const cancelAppointment = async (appointmentId) => {
    // 1. Confirmación de seguridad
    if (!confirm(`¿Está seguro que desea cancelar la cita #${appointmentId}? Esta acción es irreversible.`)) {
        return;
    }

    try {
        // La URL debe coincidir con tu endpoint: /api/citas/:id/cancelar
        const url = `${API_BASE_URL}/citas/${appointmentId}/cancelar`; 
        
        // El método debe ser PUT y NO se debe enviar 'body'
        const response = await fetch(url, {
            method: 'PUT', // <-- USAMOS PUT PARA COINCIDIR CON EL BACKEND
            headers: {
                'Content-Type': 'application/json',
                // Sin 'body', ya que el backend usa la URL y el método PUT
            },
        });

        const result = await response.json();

        // Verificamos si la respuesta HTTP es exitosa (200) Y si el success del body es true
        if (response.ok && result.success) { 
            
            // 2. Actualizar la lista local (solo si la API fue exitosa)
            const citaIndex = ALL_APPOINTMENTS.findIndex(a => a.id == appointmentId);
            
            if (citaIndex !== -1) {
                // Actualizamos el estado local a 'cancelada' (debe coincidir con la actualización del backend)
                ALL_APPOINTMENTS[citaIndex].estado = 'cancelada'; 
                
                // 3. Refrescar la tabla
                filterAppointments(); 
                
                alert(`✅ Cita #${appointmentId} cancelada exitosamente.`);
            }

        } else {
            // Manejar errores de validación (400) o no encontrado (404)
            throw new Error(result.message || 'Error desconocido al cancelar la cita.');
        }

    } catch (error) {
        console.error("Error al cancelar la cita:", error);
        alert(`❌ Ocurrió un error al cancelar la cita. Mensaje: ${error.message}`);
    }
};

window.cancelAppointment = cancelAppointment;

// -------------------------------------------------------------
// INICIALIZACIÓN
// -------------------------------------------------------------

/**
 * Función principal que se ejecuta al cargar la página.
 */
const initAppointmentsPage = async () => {
    // 1. Cargar la lista de doctores (necesario para el filtro y la tabla)
    await fetchDoctorsForFilter(); 
    await fetchAllPatients()
    // 2. Cargar todas las citas
    fetchAllAppointments();

    // 3. Asignar event listeners a los filtros
    filterDateInput.addEventListener('change', filterAppointments);
    filterStatusSelect.addEventListener('change', filterAppointments);
    filterDoctorSelect.addEventListener('change', filterAppointments);
};

// Asegúrate de que document.addEventListener esté llamando a la versión async
document.addEventListener('DOMContentLoaded', () => {
    initAppointmentsPage(); 
});

// NOTA: Las funciones 'mostrarMensaje', 'validarDoctor', 'obtenerParametroURL',
// 'getFechaHoraPST', 'dateToString', 'getDateRange', 'renderDoctorHeader', 
// 'fetchDoctorDetails', 'renderAppointments', 'updateStats', 'setActiveFilterButton',
// 'filterByDate', 'handleSubmit', y 'handleEditSubmit'
// deben ser copiadas del código base que ya tienes si se usan en otras páginas.
// Para esta página (citas.html), solo necesitamos las expuestas con 'window.' y las internas.