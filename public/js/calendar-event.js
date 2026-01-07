/**
 * Calendar Event Management - Frontend JavaScript
 * Handle CRUD operations untuk calendar event dengan FullCalendar
 */

let calendar;
let currentEventData = null;

/**
 * Initialize FullCalendar
 */
function initializeCalendar() {
  console.log('🔄 Initializing Calendar Event...');
  
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) {
    console.warn('⚠️ Calendar element not found');
    return;
  }

  calendar = new FullCalendar.Calendar(calendarEl, {
    timeZone: 'local',
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    buttonText: {
      today: 'Hari Ini',
      month: 'Bulan',
      week: 'Minggu',
      day: 'Hari',
      list: 'List'
    },
    locale: 'id',
    firstDay: 1, // Monday
    height: 'auto',
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    
    // Load events from API
    events: function(info, successCallback, failureCallback) {
      fetch('/api/event')
        .then(response => response.json())
        .then(result => {
          console.log('📥 Events data from API:', result);
          
          if (result.success) {
            const events = result.data.map(event => {
              // Parse tanggal dari database - LANGSUNG ambil string tanpa konversi Date
              let dateStr = event.tanggal_event;
              
              // Jika tanggal_event adalah ISO string (2026-01-09T00:00:00.000Z)
              if (typeof dateStr === 'string' && dateStr.includes('T')) {
                // Parse using Date and use local date components to avoid UTC truncation
                const tmp = new Date(dateStr);
                const yy = tmp.getFullYear();
                const mm = String(tmp.getMonth() + 1).padStart(2, '0');
                const dd = String(tmp.getDate()).padStart(2, '0');
                dateStr = `${yy}-${mm}-${dd}`;
              } else if (typeof dateStr === 'object' && dateStr !== null) {
                // Jika Date object, JANGAN gunakan toISOString (karena convert ke UTC)
                // Gunakan manual formatting dalam local timezone
                const d = new Date(dateStr);
                // Tambahkan offset timezone untuk mendapatkan tanggal lokal yang benar
                const offsetMs = d.getTimezoneOffset() * 60 * 1000;
                const localDate = new Date(d.getTime() - offsetMs);
                dateStr = localDate.toISOString().substring(0, 10);
              }
              
              // Parse waktu dari database - LANGSUNG ambil string tanpa konversi
              let timeStr = event.waktu_event;
              
              // Jika waktu_event adalah ISO string atau object
              if (typeof timeStr === 'string' && timeStr.includes('T')) {
                // Extract waktu dari ISO string (format: 1970-01-01T08:00:00.000Z)
                // Ambil bagian setelah T dan sebelum detik
                const timePart = timeStr.split('T')[1];
                timeStr = timePart.substring(0, 5); // HH:MM
              } else if (typeof timeStr === 'object' && timeStr !== null) {
                // Jika Date object
                const d = new Date(timeStr);
                const hours = String(d.getUTCHours()).padStart(2, '0');
                const minutes = String(d.getUTCMinutes()).padStart(2, '0');
                timeStr = `${hours}:${minutes}`;
              } else if (typeof timeStr === 'string') {
                // Jika format HH:MM:SS atau HH:MM
                if (timeStr.length > 5) {
                  timeStr = timeStr.substring(0, 5); // HH:MM
                }
              }
              
              // Ensure we have valid time
              if (!timeStr || timeStr.trim() === '') {
                timeStr = '00:00';
              }

              // Build a local Date object from parts to avoid timezone conversion issues
              const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
              const [hh, mm] = timeStr.split(':').map(n => parseInt(n, 10));
              const startDate = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);

              const eventData = {
                id: event.id_event,
                title: event.nama_event,
                start: startDate,
                extendedProps: {
                  lokasi: event.lokasi,
                  penanggung_jawab: event.penanggung_jawab,
                  keterangan: event.keterangan
                },
                backgroundColor: '#5D87FF',
                borderColor: '#5D87FF'
              };
              
              console.log('📅 Mapped event:', eventData);
              console.log('   - Raw tanggal:', event.tanggal_event);
              console.log('   - Parsed dateStr:', dateStr);
              console.log('   - Raw waktu:', event.waktu_event);
              console.log('   - Parsed timeStr:', timeStr);
              return eventData;
            });
            
            console.log('✅ Total events loaded:', events.length);
            successCallback(events);
          } else {
            failureCallback(new Error('Failed to load events'));
            showAlert('danger', 'Gagal memuat data event');
          }
        })
        .catch(error => {
          console.error('❌ Error loading events:', error);
          failureCallback(error);
          showAlert('danger', 'Gagal memuat data event');
        });
    },
    
    // Click on date cell to add event
    dateClick: function(info) {
      openAddModal(info.dateStr);
    },
    
    // Click on event to view details
    eventClick: function(info) {
      info.jsEvent.preventDefault();
      viewEventDetail(info.event);
    }
  });

  calendar.render();
  console.log('✅ Calendar initialized');

  // Setup event listeners
  setupEventListeners();
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Add Event Button
  $('#btnAddEvent').on('click', function(e) {
    e.preventDefault();
    openAddModal();
  });
  
  // Form Submit
  $('#eventForm').on('submit', handleSaveEvent);
  
  // Edit from view modal
  $('#btnEditFromView').on('click', function() {
    $('#viewEventModal').modal('hide');
    if (currentEventData) {
      openEditModal(currentEventData);
    }
  });
  
  // Delete from view modal
  $('#btnDeleteFromView').on('click', function() {
    $('#viewEventModal').modal('hide');
    if (currentEventData) {
      openDeleteModal(currentEventData.id, currentEventData.title);
    }
  });
  
  // Confirm Delete
  $('#confirmDelete').on('click', handleDeleteEvent);
  
  console.log('✅ Event listeners attached');
}

/**
 * Open Add Event Modal
 */
function openAddModal(dateStr = null) {
  $('#eventModalLabel').text('Tambah Event');
  $('#eventForm')[0].reset();
  $('#eventId').val('');
  
  // Set tanggal jika diklik dari calendar
  if (dateStr) {
    $('#tanggalEvent').val(dateStr);
  }
  
  $('#eventModal').modal('show');
}

/**
 * Open Edit Event Modal
 */
function openEditModal(eventData) {
  $('#eventModalLabel').text('Edit Event');
  
  // Parse date and time from event start
  const eventDate = new Date(eventData.start);
  const dateStr = eventDate.toISOString().split('T')[0];
  const timeStr = eventDate.toTimeString().split(' ')[0].substring(0, 5);
  
  $('#eventId').val(eventData.id);
  $('#namaEvent').val(eventData.title);
  $('#lokasi').val(eventData.extendedProps.lokasi);
  $('#tanggalEvent').val(dateStr);
  $('#waktuEvent').val(timeStr);
  $('#penanggungJawab').val(eventData.extendedProps.penanggung_jawab);
  $('#keterangan').val(eventData.extendedProps.keterangan || '');
  
  $('#eventModal').modal('show');
}

/**
 * View Event Detail Modal
 */
function viewEventDetail(event) {
  currentEventData = event;
  
  const eventDate = new Date(event.start);
  const dateStr = eventDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = eventDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  $('#viewNamaEvent').text(event.title);
  $('#viewLokasi').text(event.extendedProps.lokasi);
  $('#viewTanggal').text(dateStr);
  $('#viewWaktu').text(timeStr);
  $('#viewPenanggungJawab').text(event.extendedProps.penanggung_jawab);
  $('#viewKeterangan').text(event.extendedProps.keterangan || '-');
  
  $('#viewEventModal').modal('show');
}

/**
 * Handle Save Event (Create/Update)
 */
async function handleSaveEvent(e) {
  e.preventDefault();
  
  const eventId = $('#eventId').val();
  const isEdit = eventId !== '';
  
  const formData = {
    nama_event: $('#namaEvent').val().trim(),
    lokasi: $('#lokasi').val().trim(),
    tanggal_event: $('#tanggalEvent').val(),
    waktu_event: $('#waktuEvent').val(),
    penanggung_jawab: $('#penanggungJawab').val().trim(),
    keterangan: $('#keterangan').val().trim()
  };
  
  // Validation
  if (!formData.nama_event || !formData.lokasi || !formData.tanggal_event || 
      !formData.waktu_event || !formData.penanggung_jawab) {
    showAlert('warning', 'Mohon lengkapi semua field yang wajib diisi');
    return;
  }
  
  try {
    const url = isEdit ? `/api/event/${eventId}` : '/api/event';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAlert('success', result.message || (isEdit ? 'Event berhasil diperbarui' : 'Event berhasil ditambahkan'));
      $('#eventModal').modal('hide');
      calendar.refetchEvents(); // Reload events
    } else {
      showAlert('danger', result.message || 'Gagal menyimpan event');
    }
  } catch (error) {
    console.error('Error saving event:', error);
    showAlert('danger', 'Terjadi kesalahan saat menyimpan event');
  }
}

/**
 * Open Delete Confirmation Modal
 */
function openDeleteModal(eventId, eventName) {
  $('#deleteEventId').val(eventId);
  $('#deleteEventName').text(eventName);
  $('#deleteModal').modal('show');
}

/**
 * Handle Delete Event
 */
async function handleDeleteEvent() {
  const eventId = $('#deleteEventId').val();
  
  if (!eventId) {
    showAlert('danger', 'ID Event tidak ditemukan');
    return;
  }
  
  try {
    const response = await fetch(`/api/event/${eventId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAlert('success', result.message || 'Event berhasil dihapus');
      $('#deleteModal').modal('hide');
      calendar.refetchEvents(); // Reload events
    } else {
      showAlert('danger', result.message || 'Gagal menghapus event');
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    showAlert('danger', 'Terjadi kesalahan saat menghapus event');
  }
}

/**
 * Show Alert Message
 */
function showAlert(type, message) {
  const alertDiv = $('#alertMessage');
  const alertText = $('#alertText');
  
  alertDiv.removeClass('alert-success alert-danger alert-warning alert-info');
  alertDiv.addClass(`alert-${type} show`);
  alertText.text(message);
  alertDiv.show();
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    alertDiv.removeClass('show');
    setTimeout(() => alertDiv.hide(), 150);
  }, 5000);
}

// Make function available globally
window.initializeCalendar = initializeCalendar;
