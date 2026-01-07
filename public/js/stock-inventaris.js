/**
 * Stock Inventaris Management
 * Handle CRUD operations untuk inventaris barang
 */

// DataTable instance
let inventarisTable = null;

// Initialize DataTable
function initInventarisTable() {
  if ($.fn.DataTable.isDataTable('#inventarisTable')) {
    $('#inventarisTable').DataTable().destroy();
  }

  inventarisTable = $('#inventarisTable').DataTable({
    ajax: {
      url: '/api/inventaris',
      dataSrc: function(json) {
        if (json.success) {
          return json.data;
        }
        return [];
      },
      error: function(xhr, error, thrown) {
        console.error('Error loading inventaris:', error);
        alert('Gagal memuat data inventaris');
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
      { data: 'nama_barang' },
      { 
        data: 'jumlah',
        render: function(data) {
          return `<span class="badge bg-info">${data}</span>`;
        }
      },
      { 
        data: 'kondisi',
        render: function(data) {
          let badgeClass = 'bg-secondary';
          if (data === 'Baik') badgeClass = 'bg-success';
          else if (data === 'Rusak') badgeClass = 'bg-danger';
          else if (data === 'Perlu Perbaikan') badgeClass = 'bg-warning';
          
          return `<span class="badge ${badgeClass}">${data || '-'}</span>`;
        }
      },
      { 
        data: 'tanggal_update',
        render: function(data) {
          if (!data) return '-';
          
          // Parse tanggal lokal
          const [y, m, d] = data.split('-').map(n => parseInt(n, 10));
          const date = new Date(y, m - 1, d);
          
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          
          return `${day}/${month}/${year}`;
        }
      },
      { 
        data: 'keterangan',
        render: function(data) {
          if (!data) return '-';
          return data.length > 50 ? data.substring(0, 50) + '...' : data;
        }
      },
      {
        data: null,
        render: function(data, type, row) {
          return `
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-info btn-view" data-id="${row.id_inventaris}" title="Lihat Detail">
                <iconify-icon icon="tabler:eye" width="16"></iconify-icon>
              </button>
              <button class="btn btn-sm btn-warning btn-edit" data-id="${row.id_inventaris}" title="Edit">
                <iconify-icon icon="tabler:edit" width="16"></iconify-icon>
              </button>
              <button class="btn btn-sm btn-danger btn-delete" data-id="${row.id_inventaris}" title="Hapus">
                <iconify-icon icon="tabler:trash" width="16"></iconify-icon>
              </button>
            </div>
          `;
        },
        orderable: false,
        width: '150px'
      }
    ],
    order: [[4, 'desc']], // Sort by tanggal_update descending
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/id.json'
    },
    responsive: true,
    pageLength: 10,
    lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]]
  });
}

// Load inventaris data
async function loadInventaris() {
  if (inventarisTable) {
    inventarisTable.ajax.reload(null, false);
  }
}

// Show Add Modal
function showAddModal() {
  // Reset form
  document.getElementById('inventarisForm').reset();
  document.getElementById('inventarisId').value = '';
  document.getElementById('inventarisModalLabel').textContent = 'Tambah Inventaris';
  
  // Set tanggal hari ini sebagai default
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  document.getElementById('tanggal_update').value = `${yyyy}-${mm}-${dd}`;
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('inventarisModal'));
  modal.show();
}

// Show Edit Modal
async function showEditModal(id) {
  try {
    // Fetch data dari API
    const response = await fetch(`/api/inventaris/${id}`);
    const result = await response.json();
    
    if (!result.success) {
      alert(result.message || 'Gagal memuat data inventaris');
      return;
    }
    
    const data = result.data;
    
    // Populate form
    document.getElementById('inventarisId').value = data.id_inventaris;
    document.getElementById('nama_barang').value = data.nama_barang || '';
    document.getElementById('jumlah').value = data.jumlah || 0;
    document.getElementById('kondisi').value = data.kondisi || '';
    document.getElementById('tanggal_update').value = data.tanggal_update || '';
    document.getElementById('keterangan').value = data.keterangan || '';
    
    // Update modal title
    document.getElementById('inventarisModalLabel').textContent = 'Edit Inventaris';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('inventarisModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading inventaris:', error);
    alert('Gagal memuat data inventaris');
  }
}

// Show View Modal
async function showViewModal(id) {
  try {
    const response = await fetch(`/api/inventaris/${id}`);
    const result = await response.json();
    
    if (!result.success) {
      alert(result.message || 'Gagal memuat data inventaris');
      return;
    }
    
    const data = result.data;
    
    // Populate detail
    document.getElementById('viewNamaBarang').textContent = data.nama_barang || '-';
    document.getElementById('viewJumlah').textContent = data.jumlah || 0;
    
    // Kondisi dengan badge
    let kondisiBadge = 'bg-secondary';
    if (data.kondisi === 'Baik') kondisiBadge = 'bg-success';
    else if (data.kondisi === 'Rusak') kondisiBadge = 'bg-danger';
    else if (data.kondisi === 'Perlu Perbaikan') kondisiBadge = 'bg-warning';
    document.getElementById('viewKondisi').innerHTML = 
      `<span class="badge ${kondisiBadge}">${data.kondisi || '-'}</span>`;
    
    // Format tanggal
    if (data.tanggal_update) {
      const [y, m, d] = data.tanggal_update.split('-').map(n => parseInt(n, 10));
      const date = new Date(y, m - 1, d);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      document.getElementById('viewTanggalUpdate').textContent = `${day}/${month}/${year}`;
    } else {
      document.getElementById('viewTanggalUpdate').textContent = '-';
    }
    
    document.getElementById('viewKeterangan').textContent = data.keterangan || '-';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewInventarisModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading inventaris:', error);
    alert('Gagal memuat data inventaris');
  }
}

// Save Inventaris (Create or Update)
async function saveInventaris(event) {
  event.preventDefault();
  
  const id = document.getElementById('inventarisId').value;
  const formData = {
    nama_barang: document.getElementById('nama_barang').value.trim(),
    jumlah: parseInt(document.getElementById('jumlah').value),
    kondisi: document.getElementById('kondisi').value,
    tanggal_update: document.getElementById('tanggal_update').value,
    keterangan: document.getElementById('keterangan').value.trim()
  };
  
  // Validasi
  if (!formData.nama_barang) {
    alert('Nama barang harus diisi');
    return;
  }
  
  if (isNaN(formData.jumlah) || formData.jumlah < 0) {
    alert('Jumlah harus berupa angka positif');
    return;
  }
  
  if (!formData.kondisi) {
    alert('Kondisi harus dipilih');
    return;
  }
  
  try {
    const url = id ? `/api/inventaris/${id}` : '/api/inventaris';
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
      const modal = bootstrap.Modal.getInstance(document.getElementById('inventarisModal'));
      modal.hide();
      
      // Reload table
      loadInventaris();
    } else {
      alert(result.message || 'Gagal menyimpan inventaris');
    }
  } catch (error) {
    console.error('Error saving inventaris:', error);
    alert('Terjadi kesalahan saat menyimpan inventaris');
  }
}

// Show Delete Confirmation
function showDeleteModal(id) {
  document.getElementById('deleteInventarisId').value = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteInventarisModal'));
  modal.show();
}

// Delete Inventaris
async function deleteInventaris() {
  const id = document.getElementById('deleteInventarisId').value;
  
  try {
    const response = await fetch(`/api/inventaris/${id}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteInventarisModal'));
      modal.hide();
      
      // Reload table
      loadInventaris();
    } else {
      alert(result.message || 'Gagal menghapus inventaris');
    }
  } catch (error) {
    console.error('Error deleting inventaris:', error);
    alert('Terjadi kesalahan saat menghapus inventaris');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize DataTable
  initInventarisTable();
  
  // Event listeners for buttons
  document.getElementById('btnAddInventaris').addEventListener('click', showAddModal);
  
  // Event delegation for table buttons
  $('#inventarisTable').on('click', '.btn-view', function() {
    const id = $(this).data('id');
    showViewModal(id);
  });
  
  $('#inventarisTable').on('click', '.btn-edit', function() {
    const id = $(this).data('id');
    showEditModal(id);
  });
  
  $('#inventarisTable').on('click', '.btn-delete', function() {
    const id = $(this).data('id');
    showDeleteModal(id);
  });
  
  // Form submit
  document.getElementById('inventarisForm').addEventListener('submit', saveInventaris);
  
  // Delete confirmation
  document.getElementById('btnConfirmDelete').addEventListener('click', deleteInventaris);
});
