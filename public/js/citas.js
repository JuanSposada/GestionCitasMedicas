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

        // Determinación de clases para el estado (pills)
        let statusClass = '';
        let buttonAction = '';
        let buttonText = '';
        let buttonDisabled = '';

        switch (cita.estado.toLowerCase()) {
            case 'programada':
                statusClass = 'status-programada';
                buttonAction = `showModalDetails(${cita.id})`;
                buttonText = 'Detalles';
                buttonDisabled = '';
                break;
            case 'cancelada':
                statusClass = 'status-cancelada';
                buttonAction = `showModalDetails(${cita.id})`;
                buttonText = 'Detalles';
                buttonDisabled = 'btn-disabled';
                break;
            case 'completada':
                statusClass = 'status-completada';
                buttonAction = `showModalDetails(${cita.id})`;
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
                <td data-label="Paciente">${cita.pacienteNombre}</td> 
                <td data-label="Doctor">${doctor.nombre}</td>
                <td data-label="Especialidad">${doctor.especialidad}</td>
                <td data-label="Motivo">${cita.motivo.substring(0, 30)}...</td>
                <td data-label="Estado"><span class="status-pill ${statusClass}">${cita.estado}</span></td>
                <td data-label="Acciones" class="action-buttons">
                    <button onclick="${buttonAction}" class="btn-details">Ver ${buttonText}</button>
                    <button onclick="cancelAppointment(${cita.id})" class="btn-cancel ${cita.estado.toLowerCase() !== 'programada' ? 'btn-disabled' : ''}" ${cita.estado.toLowerCase() !== 'programada' ? 'disabled' : ''}>Cancelar</button>
                </td>
            </tr>
        `;
        appointmentsTableBody.insertAdjacentHTML('beforeend', rowHtml);
    });
};


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

/**
 * Busca y muestra los detalles de una cita específica en el modal.
 * @param {number} appointmentId - ID de la cita a mostrar.
 */
const showModalDetails = (appointmentId) => {
    const cita = ALL_APPOINTMENTS.find(a => a.id == appointmentId);
    if (!cita) {
        alert('Cita no encontrada.');
        return;
    }

    const doctor = ALL_DOCTORS.find(d => d.id == cita.doctorId) || { nombre: 'N/A', especialidad: 'N/A' };
    
    const detailsHtml = `
        <p><strong>ID de Cita:</strong> ${cita.id}</p>
        <p><strong>Estado:</strong> <span class="status-pill ${cita.estado.toLowerCase()}">${cita.estado}</span></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
        <p><strong>Fecha y Hora:</strong> ${cita.fecha} a las ${cita.hora}</p>
        <p><strong>Paciente:</strong> ${cita.pacienteNombre} (ID: ${cita.pacienteId})</p>
        <p><strong>Doctor:</strong> ${doctor.nombre}</p>
        <p><strong>Especialidad:</strong> ${doctor.especialidad}</p>
        <p><strong>Motivo Completo:</strong> ${cita.motivo}</p>
    `;

    modalDetailsContent.innerHTML = detailsHtml;
    mostrarModal('details-modal');
};
// Expone la función al ámbito global para el HTML
window.showModalDetails = showModalDetails;


// -------------------------------------------------------------
// FUNCIÓN 7: CANCELAR CITA (Simulación de POST/PUT)
// -------------------------------------------------------------

/**
 * Envía una solicitud al servidor para cambiar el estado de la cita a 'cancelada'.
 * @param {number} appointmentId - ID de la cita a cancelar.
 */
const cancelAppointment = async (appointmentId) => {
    if (!confirm(`¿Está seguro que desea cancelar la cita #${appointmentId}? Esta acción es irreversible.`)) {
        return;
    }

    try {
        // En un entorno real, enviaríamos un PUT/PATCH para actualizar el estado
        const url = `${API_BASE_URL}/citas/${appointmentId}/cancelar`; 
        
        // Simulación: No hacemos un fetch real, solo actualizamos el estado en memoria para el demo
        // Reemplaza esta simulación con tu lógica de fetch real:
        // const response = await fetch(url, { method: 'PATCH' });
        // if (!response.ok) throw new Error('Falló la cancelación en el servidor');
        // const result = await response.json();

        // SIMULACIÓN:
        const citaIndex = ALL_APPOINTMENTS.findIndex(a => a.id == appointmentId);
        if (citaIndex !== -1 && ALL_APPOINTMENTS[citaIndex].estado.toLowerCase() === 'programada') {
            ALL_APPOINTMENTS[citaIndex].estado = 'Cancelada'; // Actualiza el estado
            alert(`Cita #${appointmentId} cancelada exitosamente.`);
            filterAppointments(); // Volver a renderizar la tabla con el nuevo estado
        } else if (citaIndex !== -1) {
            alert(`La cita #${appointmentId} ya está en estado: ${ALL_APPOINTMENTS[citaIndex].estado}.`);
        } else {
            alert('Error: Cita no encontrada localmente.');
        }


    } catch (error) {
        console.error("Error al cancelar la cita:", error);
        alert('Ocurrió un error al intentar cancelar la cita. Revise la consola.');
    }
};
// Expone la función al ámbito global para el HTML
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