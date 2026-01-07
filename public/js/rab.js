/**
 * RAB (Rencana Anggaran Biaya) Management
 * Handle CRUD operations untuk RAB
 */

// DataTable instance
let rabTable = null;

// Format currency IDR
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Initialize DataTable
function initRABTable() {
  if ($.fn.DataTable.isDataTable('#rabTable')) {
    $('#rabTable').DataTable().destroy();
  }

  rabTable = $('#rabTable').DataTable({
    ajax: {
      url: '/api/rab',
      dataSrc: function(json) {
        if (json.success) {
          return json.data;
        }
        return [];
      },
      error: function(xhr, error, thrown) {
        console.error('Error loading rab:', error);
        alert('Gagal memuat data RAB');
      }
    },
    columns: [
      { 
        data: null,
        render: function(data, type, row, meta) {
          return meta.row + 1;
        },
        orderable: false,
        width: '50px'
      },
      { data: 'nama_kegiatan' },
      { 
        data: 'anggaran',
        render: function(data) {
          return formatRupiah(data || 0);
        },
        className: 'text-end'
      },
      { 
        data: 'realisasi',
        render: function(data) {
          return formatRupiah(data || 0);
        },
        className: 'text-end'
      },
      { 
        data: 'sisa_anggaran',
        render: function(data) {
          const color = data < 0 ? 'text-danger' : 'text-success';
          return `<span class="${color} fw-bold">${formatRupiah(data || 0)}</span>`;
        },
        className: 'text-end'
      },
      { 
        data: 'persentase_realisasi',
        render: function(data, type, row) {
          const percentage = parseFloat(data) || 0;
          let progressClass = 'bg-info';
          if (percentage >= 100) progressClass = 'bg-danger';
          else if (percentage >= 75) progressClass = 'bg-warning';
          else if (percentage >= 50) progressClass = 'bg-primary';
          
          return `
            <div class="d-flex align-items-center">
              <div class="progress grow me-2" style="height: 20px;">
                <div class="progress-bar ${progressClass}" role="progressbar" 
                     style="width: ${Math.min(percentage, 100)}%"
                     aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                  ${percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          `;
        },
        width: '150px'
      },
      { 
        data: 'status',
        render: function(data) {
          let badgeClass = 'bg-secondary';
          if (data === 'Disetujui') badgeClass = 'bg-success';
          else if (data === 'Ditolak') badgeClass = 'bg-danger';
          else if (data === 'Dalam Proses') badgeClass = 'bg-warning';
          else if (data === 'Selesai') badgeClass = 'bg-info';
          
          return `<span class="badge ${badgeClass}">${data || 'Diajukan'}</span>`;
        }
      },
      { 
        data: 'tanggal_pengajuan',
        render: function(data) {
          if (!data) return '-';
          
          const [y, m, d] = data.split('-').map(n => parseInt(n, 10));
          const date = new Date(y, m - 1, d);
          
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          
          return `${day}/${month}/${year}`;
        },
        width: '100px'
      },
      {
        data: null,
        render: function(data, type, row) {
          return `
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-info btn-view" data-id="${row.id_rab}" title="Lihat Detail">
                <iconify-icon icon="tabler:eye" width="16"></iconify-icon>
              </button>
              <button class="btn btn-sm btn-warning btn-edit" data-id="${row.id_rab}" title="Edit">
                <iconify-icon icon="tabler:edit" width="16"></iconify-icon>
              </button>
              <button class="btn btn-sm btn-danger btn-delete" data-id="${row.id_rab}" title="Hapus">
                <iconify-icon icon="tabler:trash" width="16"></iconify-icon>
              </button>
            </div>
          `;
        },
        orderable: false,
        width: '150px'
      }
    ],
    order: [[7, 'desc']], // Sort by tanggal_pengajuan descending
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/id.json'
    },
    responsive: true,
    pageLength: 10,
    lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]]
  });
}

// Load RAB data
async function loadRAB() {
  if (rabTable) {
    rabTable.ajax.reload(null, false);
  }
}

// Show Add Modal
function showAddModal() {
  // Reset form
  document.getElementById('rabForm').reset();
  document.getElementById('rabId').value = '';
  document.getElementById('rabModalLabel').textContent = 'Tambah RAB';
  
  // Set tanggal hari ini sebagai default
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  document.getElementById('tanggal_pengajuan').value = `${yyyy}-${mm}-${dd}`;
  
  // Set default realisasi 0
  document.getElementById('realisasi').value = '0';
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('rabModal'));
  modal.show();
}

// Show Edit Modal
async function showEditModal(id) {
  try {
    const response = await fetch(`/api/rab/${id}`);
    const result = await response.json();
    
    if (!result.success) {
      alert(result.message || 'Gagal memuat data RAB');
      return;
    }
    
    const data = result.data;
    
    // Populate form
    document.getElementById('rabId').value = data.id_rab;
    document.getElementById('nama_kegiatan').value = data.nama_kegiatan || '';
    document.getElementById('anggaran').value = data.anggaran || 0;
    document.getElementById('realisasi').value = data.realisasi || 0;
    document.getElementById('tanggal_pengajuan').value = data.tanggal_pengajuan || '';
    document.getElementById('status').value = data.status || 'Diajukan';
    document.getElementById('keterangan').value = data.keterangan || '';
    
    // Update modal title
    document.getElementById('rabModalLabel').textContent = 'Edit RAB';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('rabModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading rab:', error);
    alert('Gagal memuat data RAB');
  }
}

// Show View Modal
async function showViewModal(id) {
  try {
    const response = await fetch(`/api/rab/${id}`);
    const result = await response.json();
    
    if (!result.success) {
      alert(result.message || 'Gagal memuat data RAB');
      return;
    }
    
    const data = result.data;
    
    // Calculate values
    const anggaran = parseFloat(data.anggaran) || 0;
    const realisasi = parseFloat(data.realisasi) || 0;
    const sisaAnggaran = anggaran - realisasi;
    const persentase = anggaran > 0 ? ((realisasi / anggaran) * 100).toFixed(2) : 0;
    
    // Populate detail
    document.getElementById('viewNamaKegiatan').textContent = data.nama_kegiatan || '-';
    document.getElementById('viewAnggaran').textContent = formatRupiah(anggaran);
    document.getElementById('viewRealisasi').textContent = formatRupiah(realisasi);
    
    // Sisa anggaran dengan warna
    const sisaColor = sisaAnggaran < 0 ? 'text-danger' : 'text-success';
    document.getElementById('viewSisaAnggaran').innerHTML = 
      `<span class="${sisaColor} fw-bold">${formatRupiah(sisaAnggaran)}</span>`;
    
    // Progress bar
    let progressClass = 'bg-info';
    if (persentase >= 100) progressClass = 'bg-danger';
    else if (persentase >= 75) progressClass = 'bg-warning';
    else if (persentase >= 50) progressClass = 'bg-primary';
    
    document.getElementById('viewPersentase').innerHTML = `
      <div class="progress" style="height: 25px;">
        <div class="progress-bar ${progressClass}" role="progressbar" 
             style="width: ${Math.min(persentase, 100)}%"
             aria-valuenow="${persentase}" aria-valuemin="0" aria-valuemax="100">
          ${persentase}%
        </div>
      </div>
    `;
    
    // Status dengan badge
    let statusBadge = 'bg-secondary';
    if (data.status === 'Disetujui') statusBadge = 'bg-success';
    else if (data.status === 'Ditolak') statusBadge = 'bg-danger';
    else if (data.status === 'Dalam Proses') statusBadge = 'bg-warning';
    else if (data.status === 'Selesai') statusBadge = 'bg-info';
    document.getElementById('viewStatus').innerHTML = 
      `<span class="badge ${statusBadge}">${data.status || 'Diajukan'}</span>`;
    
    // Format tanggal
    if (data.tanggal_pengajuan) {
      const [y, m, d] = data.tanggal_pengajuan.split('-').map(n => parseInt(n, 10));
      const date = new Date(y, m - 1, d);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      document.getElementById('viewTanggalPengajuan').textContent = `${day}/${month}/${year}`;
    } else {
      document.getElementById('viewTanggalPengajuan').textContent = '-';
    }
    
    document.getElementById('viewKeterangan').textContent = data.keterangan || '-';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewRABModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading rab:', error);
    alert('Gagal memuat data RAB');
  }
}

// Save RAB (Create or Update)
async function saveRAB(event) {
  event.preventDefault();
  
  const id = document.getElementById('rabId').value;
  const formData = {
    nama_kegiatan: document.getElementById('nama_kegiatan').value.trim(),
    anggaran: parseFloat(document.getElementById('anggaran').value),
    realisasi: parseFloat(document.getElementById('realisasi').value) || 0,
    tanggal_pengajuan: document.getElementById('tanggal_pengajuan').value,
    status: document.getElementById('status').value,
    keterangan: document.getElementById('keterangan').value.trim()
  };
  
  // Validasi
  if (!formData.nama_kegiatan) {
    alert('Nama kegiatan harus diisi');
    return;
  }
  
  if (isNaN(formData.anggaran) || formData.anggaran < 0) {
    alert('Anggaran harus berupa angka positif');
    return;
  }
  
  if (formData.realisasi > formData.anggaran) {
    alert('Realisasi tidak boleh melebihi anggaran');
    return;
  }
  
  try {
    const url = id ? `/api/rab/${id}` : '/api/rab';
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('rabModal'));
      modal.hide();
      
      // Reload table
      loadRAB();
    } else {
      alert(result.message || 'Gagal menyimpan RAB');
    }
  } catch (error) {
    console.error('Error saving rab:', error);
    alert('Terjadi kesalahan saat menyimpan RAB');
  }
}

// Show Delete Confirmation
function showDeleteModal(id) {
  document.getElementById('deleteRABId').value = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteRABModal'));
  modal.show();
}

// Delete RAB
async function deleteRAB() {
  const id = document.getElementById('deleteRABId').value;
  
  try {
    const response = await fetch(`/api/rab/${id}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteRABModal'));
      modal.hide();
      
      // Reload table
      loadRAB();
    } else {
      alert(result.message || 'Gagal menghapus RAB');
    }
  } catch (error) {
    console.error('Error deleting rab:', error);
    alert('Terjadi kesalahan saat menghapus RAB');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize DataTable
  initRABTable();
  
  // Event listeners for buttons
  document.getElementById('btnAddRAB').addEventListener('click', showAddModal);
  
  // Event delegation for table buttons
  $('#rabTable').on('click', '.btn-view', function() {
    const id = $(this).data('id');
    showViewModal(id);
  });
  
  $('#rabTable').on('click', '.btn-edit', function() {
    const id = $(this).data('id');
    showEditModal(id);
  });
  
  $('#rabTable').on('click', '.btn-delete', function() {
    const id = $(this).data('id');
    showDeleteModal(id);
  });
  
  // Form submit
  document.getElementById('rabForm').addEventListener('submit', saveRAB);
  
  // Delete confirmation
  document.getElementById('btnConfirmDelete').addEventListener('click', deleteRAB);
});
