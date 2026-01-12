/**
 * Kegiatan Management
 * Handle CRUD operations for kegiatan
 */

$(document).ready(function () {
  let kegiatanTable;
  let isEditMode = false;

  // Initialize DataTable
  function initDataTable() {
    kegiatanTable = $("#kegiatanTable").DataTable({
      ajax: {
        url: "/api/kegiatan/list",
        dataSrc: function (json) {
          if (json.success) {
            return json.data;
          }
          return [];
        },
        error: function (xhr, error, thrown) {
          console.error("Error loading data:", error);
          showAlert("danger", "Gagal memuat data kegiatan");
        },
      },
      columns: [
        {
          data: null,
          render: function (data, type, row, meta) {
            return meta.row + 1;
          },
        },
        { data: "nama_kegiatan" },
        {
          data: "tanggal_kegiatan",
          render: function (data) {
            if (!data) return "-";
            const date = new Date(data);
            return date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
          },
        },
        { data: "lokasi" },
        {
          data: "hasil_kegiatan",
          render: function (data) {
            if (!data) return "-";
            return data.length > 50 ? data.substring(0, 50) + "..." : data;
          },
        },
        {
          data: "tanggal_input",
          render: function (data) {
            if (!data) return "-";
            const date = new Date(data);
            return date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          },
        },
        {
          data: null,
          render: function (data) {
            return `
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-info view-kegiatan" data-id="${data.id_kegiatan}" title="Lihat">
                  <i class="ti ti-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning edit-kegiatan" data-id="${data.id_kegiatan}" title="Edit">
                  <i class="ti ti-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-kegiatan" data-id="${data.id_kegiatan}" title="Hapus">
                  <i class="ti ti-trash"></i>
                </button>
              </div>
            `;
          },
        },
      ],
      order: [[5, "desc"]], // Sort by tanggal_input descending
      language: {
        url: "//cdn.datatables.net/plug-ins/1.13.7/i18n/id.json",
      },
    });
  }

  // Show Alert
  function showAlert(type, message) {
    const alertDiv = $(`
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);
    $(".container-fluid").prepend(alertDiv);
    setTimeout(() => alertDiv.alert("close"), 5000);
  }

  // Add Button Click
  $("#btnAddKegiatan").on("click", function () {
    isEditMode = false;
    $("#kegiatanModalLabel").text("Tambah Kegiatan");
    $("#kegiatanForm")[0].reset();
    $("#kegiatanId").val("");
    $("#currentDokumentasi").hide();
    $("#kegiatanModal").modal("show");
  });

  // Form Submit
  $("#kegiatanForm").on("submit", function (e) {
    e.preventDefault();

    const formData = new FormData();
    const id = $("#kegiatanId").val();

    formData.append("nama_kegiatan", $("#nama_kegiatan").val());
    formData.append("tanggal_kegiatan", $("#tanggal_kegiatan").val());
    formData.append("lokasi", $("#lokasi").val());
    formData.append("target_kegiatan", $("#target_kegiatan").val());
    formData.append("hasil_kegiatan", $("#hasil_kegiatan").val());
    formData.append("keterangan", $("#keterangan").val());

    // Handle file upload
    const dokumentasiFile = $("#dokumentasi")[0].files[0];
    if (dokumentasiFile) {
      formData.append("dokumentasi", dokumentasiFile);
    }

    const url = isEditMode ? `/api/kegiatan/update/${id}` : "/api/kegiatan/create";

    $.ajax({
      url: url,
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        if (response.success) {
          $("#kegiatanModal").modal("hide");
          kegiatanTable.ajax.reload();
          showAlert(
            "success",
            isEditMode
              ? "Kegiatan berhasil diupdate"
              : "Kegiatan berhasil ditambahkan"
          );
        } else {
          showAlert("danger", response.message || "Terjadi kesalahan");
        }
      },
      error: function (xhr) {
        showAlert("danger", "Gagal menyimpan data kegiatan");
      },
    });
  });

  // View Button Click
  $(document).on("click", ".view-kegiatan", function () {
    const id = $(this).data("id");

    $.ajax({
      url: `/api/kegiatan/detail/${id}`,
      type: "GET",
      success: function (response) {
        if (response.success) {
          const data = response.data;
          $("#viewNamaKegiatan").text(data.nama_kegiatan);
          $("#viewTanggalKegiatan").text(
            data.tanggal_kegiatan
              ? new Date(data.tanggal_kegiatan).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "-"
          );
          $("#viewLokasi").text(data.lokasi || "-");
          $("#viewTargetKegiatan").text(data.target_kegiatan || "-");
          $("#viewHasilKegiatan").text(data.hasil_kegiatan || "-");
          $("#viewTanggalInput").text(
            data.tanggal_input
              ? new Date(data.tanggal_input).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "-"
          );
          $("#viewKeterangan").text(data.keterangan || "-");

          // Handle dokumentasi
          if (data.dokumentasi) {
            $("#viewDokumentasi").html(
              `<a href="/public/uploads/kegiatan/${data.dokumentasi}" target="_blank" class="btn btn-sm btn-primary">
                <i class="ti ti-download"></i> Download
              </a>`
            );
          } else {
            $("#viewDokumentasi").text("-");
          }

          $("#viewKegiatanModal").modal("show");
        }
      },
      error: function () {
        showAlert("danger", "Gagal memuat detail kegiatan");
      },
    });
  });

  // Edit Button Click
  $(document).on("click", ".edit-kegiatan", function () {
    const id = $(this).data("id");
    isEditMode = true;

    $.ajax({
      url: `/api/kegiatan/detail/${id}`,
      type: "GET",
      success: function (response) {
        if (response.success) {
          const data = response.data;
          $("#kegiatanModalLabel").text("Edit Kegiatan");
          $("#kegiatanId").val(data.id_kegiatan);
          $("#nama_kegiatan").val(data.nama_kegiatan);
          $("#tanggal_kegiatan").val(data.tanggal_kegiatan);
          $("#lokasi").val(data.lokasi);
          $("#target_kegiatan").val(data.target_kegiatan);
          $("#hasil_kegiatan").val(data.hasil_kegiatan);
          $("#keterangan").val(data.keterangan);

          if (data.dokumentasi) {
            $("#currentDokumentasiText").text(data.dokumentasi);
            $("#currentDokumentasi").show();
          }

          $("#kegiatanModal").modal("show");
        }
      },
      error: function () {
        showAlert("danger", "Gagal memuat data kegiatan");
      },
    });
  });

  // Delete Button Click
  $(document).on("click", ".delete-kegiatan", function () {
    const id = $(this).data("id");
    $("#deleteKegiatanId").val(id);
    $("#deleteKegiatanModal").modal("show");
  });

  // Confirm Delete
  $("#btnConfirmDelete").on("click", function () {
    const id = $("#deleteKegiatanId").val();

    $.ajax({
      url: `/api/kegiatan/delete/${id}`,
      type: "DELETE",
      success: function (response) {
        if (response.success) {
          $("#deleteKegiatanModal").modal("hide");
          kegiatanTable.ajax.reload();
          showAlert("success", "Kegiatan berhasil dihapus");
        } else {
          showAlert("danger", response.message || "Gagal menghapus kegiatan");
        }
      },
      error: function () {
        showAlert("danger", "Gagal menghapus kegiatan");
      },
    });
  });

  // Initialize
  initDataTable();
});
