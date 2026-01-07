/**
 * Laporan (LPJ - Laporan Pertanggungjawaban) Management
 * Handle CRUD operations untuk LPJ dengan relasi ke RAB
 */

// DataTable instance
let laporanTable = null;

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
function initLaporanTable() {
  if ($.fn.DataTable.isDataTable('#laporanTable')) {
    $('#laporanTable').DataTable().destroy();
  }

  laporanTable = $('#laporanTable').DataTable({
    ajax: {
      url: '/api/laporan',
      dataSrc: function(json) {
        if (json.success) {
          return json.data;
        }
        return [];
      },
      error: function(xhr, error, thrown) {
        console.error('Error loading laporan:', error);
        alert('Gagal memuat data Laporan');
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
        data: 'total_pengeluaran',
        render: function(data) {
          return formatRupiah(data || 0);
        },
        className: 'text-end'
      },
      { 
        data: 'rab_anggaran',
        render: function(data, type, row) {
          if (!data) return '<span class="text-muted">-</span>';
          return formatRupiah(data);
        },
        className: 'text-end'
      },
      { 
        data: 'persentase_terhadap_rab',
        render: function(data, type, row) {
          if (!row.rab_anggaran) return '<span class="text-muted">-</span>';
          
          const percentage = parseFloat(data) || 0;
          let badgeClass = 'bg-success';
          if (percentage > 100) badgeClass = 'bg-danger';
          else if (percentage > 90) badgeClass = 'bg-warning';
          
          return `<span class="badge ${badgeClass}">${percentage.toFixed(1)}%</span>`;
        }
      },
      { 
        data: 'tanggal_lpj',
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
        data: 'bukti_dokumen',
        render: function(data) {
          if (!data) return '<span class="text-muted">Tidak ada</span>';
          return `<span class="badge bg-info"><iconify-icon icon="tabler:file-text"></iconify-icon> ${data}</span>`;
        }
      },
      {
        data: null,
        render: function(data, type, row) {
          return `
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-info btn-view" data-id="${row.id_lpj}" title="Lihat Detail">
                <iconify-icon icon="tabler:eye" width="16"></iconify-icon>
              </button>
              <button class="btn btn-sm btn-warning btn-edit" data-id="${row.id_lpj}" title="Edit">
                <iconify-icon icon="tabler:edit" width="16"></iconify-icon>
              </button>
              <button class="btn btn-sm btn-danger btn-delete" data-id="${row.id_lpj}" title="Hapus">
                <iconify-icon icon="tabler:trash" width="16"></iconify-icon>
              </button>
            </div>
          `;
        },
        orderable: false,
        width: '150px'
      }
    ],
    order: [[5, 'desc']], // Sort by tanggal_lpj descending
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/id.json'
    },
    responsive: true,
    pageLength: 10,
    lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]]
  });
}

// Load Laporan data
async function loadLaporan() {
  if (laporanTable) {
    laporanTable.ajax.reload(null, false);
  }
}

// Load RAB list for dropdown
async function loadRABList() {
  try {
    const response = await fetch('/api/rab');
    const result = await response.json();
    
    const select = document.getElementById('id_rab');
    select.innerHTML = '<option value="">Pilih RAB (Opsional)</option>';
    select.disabled = false;

    if (result && result.success) {
      if (result.data.length === 0) {
        select.innerHTML = '<option value="">Tidak ada RAB tersedia</option>';
        select.disabled = true;
        return;
      }

      result.data.forEach(rab => {
        const option = document.createElement('option');
        option.value = rab.id_rab;
        option.textContent = `${rab.nama_kegiatan} - ${formatRupiah(rab.anggaran)} (${rab.status})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading RAB list:', error);
    const select = document.getElementById('id_rab');
    select.innerHTML = '<option value="">Gagal memuat daftar RAB</option>';
    select.disabled = true;
  }
}

// Show Add Modal
async function showAddModal() {
  // Reset form
  document.getElementById('laporanForm').reset();
  document.getElementById('laporanId').value = '';
  document.getElementById('laporanModalLabel').textContent = 'Tambah Laporan';
  
  // Hide current file info
  document.getElementById('currentFileName').style.display = 'none';
  
  // Set file input as required untuk add
  document.getElementById('bukti_dokumen').required = true;
  
  // Set tanggal hari ini sebagai default
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  document.getElementById('tanggal_lpj').value = `${yyyy}-${mm}-${dd}`;
  
  // Load RAB list
  await loadRABList();
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('laporanModal'));
  modal.show();
}

// Show Edit Modal
async function showEditModal(id) {
  try {
    // Load RAB list first
    await loadRABList();
    
    const response = await fetch(`/api/laporan/${id}`);
    const result = await response.json();
    
    if (!result.success) {
      alert(result.message || 'Gagal memuat data Laporan');
      return;
    }
    
    const data = result.data;
    
    // Populate form
    document.getElementById('laporanId').value = data.id_lpj;
    document.getElementById('id_rab').value = data.id_rab || '';
    document.getElementById('nama_kegiatan').value = data.nama_kegiatan || '';
    document.getElementById('total_pengeluaran').value = data.total_pengeluaran || 0;
    document.getElementById('tanggal_lpj').value = data.tanggal_lpj || '';
    document.getElementById('keterangan').value = data.keterangan || '';
    
    // Show current file name
    if (data.bukti_dokumen) {
      document.getElementById('currentFileNameText').textContent = data.bukti_dokumen;
      document.getElementById('currentFileName').style.display = 'block';
    } else {
      document.getElementById('currentFileName').style.display = 'none';
    }
    
    // Set file input as NOT required untuk edit (opsional ganti file)
    document.getElementById('bukti_dokumen').required = false;
    
    // Update modal title
    document.getElementById('laporanModalLabel').textContent = 'Edit Laporan';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('laporanModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading laporan:', error);
    alert('Gagal memuat data Laporan');
  }
}

// Show View Modal
async function showViewModal(id) {
  try {
    const response = await fetch(`/api/laporan/${id}`);
    const result = await response.json();
    
    if (!result.success) {
      alert(result.message || 'Gagal memuat data Laporan');
      return;
    }
    
    const data = result.data;
    
    // Populate detail
    document.getElementById('viewNamaKegiatan').textContent = data.nama_kegiatan || '-';
    document.getElementById('viewTotalPengeluaran').textContent = formatRupiah(data.total_pengeluaran || 0);
    
    // RAB info
    if (data.id_rab && data.rab_nama_kegiatan) {
      document.getElementById('viewRAB').innerHTML = `
        <strong>${data.rab_nama_kegiatan}</strong><br>
        <small>Anggaran: ${formatRupiah(data.rab_anggaran || 0)}</small><br>
        <small>Status: <span class="badge bg-info">${data.rab_status || '-'}</span></small>
      `;
      
      // Persentase
      const percentage = data.rab_anggaran > 0 
        ? ((data.total_pengeluaran / data.rab_anggaran) * 100).toFixed(2) 
        : 0;
      let badgeClass = 'bg-success';
      if (percentage > 100) badgeClass = 'bg-danger';
      else if (percentage > 90) badgeClass = 'bg-warning';
      
      document.getElementById('viewPersentaseRAB').innerHTML = 
        `<span class="badge ${badgeClass}">${percentage}% dari anggaran RAB</span>`;
    } else {
      document.getElementById('viewRAB').textContent = 'Tidak terkait dengan RAB';
      document.getElementById('viewPersentaseRAB').textContent = '-';
    }
    
    // Format tanggal
    if (data.tanggal_lpj) {
      const [y, m, d] = data.tanggal_lpj.split('-').map(n => parseInt(n, 10));
      const date = new Date(y, m - 1, d);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      document.getElementById('viewTanggalLPJ').textContent = `${day}/${month}/${year}`;
    } else {
      document.getElementById('viewTanggalLPJ').textContent = '-';
    }
    
    document.getElementById('viewKeterangan').textContent = data.keterangan || '-';
    
    // PDF Viewer
    if (data.bukti_dokumen) {
      const pdfUrl = `/public/uploads/laporan/${data.bukti_dokumen}`;
      document.getElementById('pdfViewer').src = pdfUrl;
      document.getElementById('pdfViewer').style.display = 'block';
      document.getElementById('noPDFMessage').style.display = 'none';
      
      // Download button
      document.getElementById('btnDownloadPDF').href = pdfUrl;
      document.getElementById('btnDownloadPDF').style.display = 'inline-block';
    } else {
      document.getElementById('pdfViewer').style.display = 'none';
      document.getElementById('noPDFMessage').style.display = 'block';
      document.getElementById('btnDownloadPDF').style.display = 'none';
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewLaporanModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading laporan:', error);
    alert('Gagal memuat data Laporan');
  }
}

// Save Laporan (Create or Update)
async function saveLaporan(event) {
  event.preventDefault();
  
  const id = document.getElementById('laporanId').value;
  const fileInput = document.getElementById('bukti_dokumen');
  
  // Validasi file untuk Add (harus ada file)
  if (!id && !fileInput.files.length) {
    alert('File PDF bukti dokumen harus diupload');
    return;
  }
  
  // Validasi file type
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
      alert('Hanya file PDF yang diperbolehkan');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Ukuran file maksimal 5MB');
      return;
    }
  }
  
  // Create FormData untuk upload file
  const formData = new FormData();
  formData.append('id_rab', document.getElementById('id_rab').value || '');
  formData.append('nama_kegiatan', document.getElementById('nama_kegiatan').value.trim());
  formData.append('total_pengeluaran', document.getElementById('total_pengeluaran').value);
  formData.append('tanggal_lpj', document.getElementById('tanggal_lpj').value);
  formData.append('keterangan', document.getElementById('keterangan').value.trim());
  
  // Append file jika ada
  if (fileInput.files.length > 0) {
    formData.append('bukti_dokumen', fileInput.files[0]);
  }
  
  // Validasi
  if (!formData.get('nama_kegiatan')) {
    alert('Nama kegiatan harus diisi');
    return;
  }
  
  const totalPengeluaran = parseFloat(formData.get('total_pengeluaran'));
  if (isNaN(totalPengeluaran) || totalPengeluaran < 0) {
    alert('Total pengeluaran harus berupa angka positif');
    return;
  }
  
  try {
    const url = id ? `/api/laporan/${id}` : '/api/laporan';
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      body: formData // Tidak pakai Content-Type header, browser akan set otomatis untuk multipart/form-data
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('laporanModal'));
      modal.hide();
      
      // Reload table
      loadLaporan();
    } else {
      alert(result.message || 'Gagal menyimpan Laporan');
    }
  } catch (error) {
    console.error('Error saving laporan:', error);
    alert('Terjadi kesalahan saat menyimpan Laporan');
  }
}

// Show Delete Confirmation
function showDeleteModal(id) {
  document.getElementById('deleteLaporanId').value = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteLaporanModal'));
  modal.show();
}

// Delete Laporan
async function deleteLaporan() {
  const id = document.getElementById('deleteLaporanId').value;
  
  try {
    const response = await fetch(`/api/laporan/${id}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteLaporanModal'));
      modal.hide();
      
      // Reload table
      loadLaporan();
    } else {
      alert(result.message || 'Gagal menghapus Laporan');
    }
  } catch (error) {
    console.error('Error deleting laporan:', error);
    alert('Terjadi kesalahan saat menghapus Laporan');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize DataTable
  initLaporanTable();
  
  // Event listeners for buttons
  document.getElementById('btnAddLaporan').addEventListener('click', showAddModal);
  
  // Event delegation for table buttons
  $('#laporanTable').on('click', '.btn-view', function() {
    const id = $(this).data('id');
    showViewModal(id);
  });
  
  $('#laporanTable').on('click', '.btn-edit', function() {
    const id = $(this).data('id');
    showEditModal(id);
  });
  
  $('#laporanTable').on('click', '.btn-delete', function() {
    const id = $(this).data('id');
    showDeleteModal(id);
  });
  
  // Form submit
  document.getElementById('laporanForm').addEventListener('submit', saveLaporan);
  
  // Delete confirmation
  document.getElementById('btnConfirmDelete').addEventListener('click', deleteLaporan);
});
