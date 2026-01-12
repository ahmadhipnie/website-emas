/**
 * Stock ATM & Buku Tabungan Management
 * Handle CRUD operations for stock_atm_buku_tabungan
 */

$(document).ready(function () {
  let stockTable;
  let isEditMode = false;

  // Initialize DataTable
  function initDataTable() {
    stockTable = $("#stockTable").DataTable({
      ajax: {
        url: "/api/stock-atm-buku/list",
        dataSrc: function (json) {
          if (json.success) {
            return json.data;
          }
          return [];
        },
        error: function (xhr, error, thrown) {
          console.error("Error loading data:", error);
          showAlert("danger", "Gagal memuat data stock");
        },
      },
      columns: [
        {
          data: null,
          render: function (data, type, row, meta) {
            return meta.row + 1;
          },
        },
        {
          data: "jenis_item",
          render: function (data) {
            const badgeClass = data === "ATM" ? "bg-primary" : "bg-success";
            return `<span class="badge ${badgeClass}">${data}</span>`;
          },
        },
        { data: "jenis_atm" },
        {
          data: "jumlah",
          render: function (data) {
            return `<span class="fw-bold">${data}</span>`;
          },
        },
        {
          data: "tanggal_update",
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
          data: "keterangan",
          render: function (data) {
            if (!data) return "-";
            return data.length > 50 ? data.substring(0, 50) + "..." : data;
          },
        },
        {
          data: null,
          render: function (data) {
            return `
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-info view-stock" data-id="${data.id_stok}" title="Lihat">
                  <i class="ti ti-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning edit-stock" data-id="${data.id_stok}" title="Edit">
                  <i class="ti ti-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-stock" data-id="${data.id_stok}" title="Hapus">
                  <i class="ti ti-trash"></i>
                </button>
              </div>
            `;
          },
        },
      ],
      order: [[4, "desc"]], // Sort by tanggal_update descending
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
  $("#btnAddStock").on("click", function () {
    isEditMode = false;
    $("#stockModalLabel").text("Tambah Stock");
    $("#stockForm")[0].reset();
    $("#stockId").val("");
    $("#stockModal").modal("show");
  });

  // Form Submit
  $("#stockForm").on("submit", function (e) {
    e.preventDefault();

    const data = {
      jenis_item: $("#jenis_item").val(),
      jenis_atm: $("#jenis_atm").val(),
      jumlah: $("#jumlah").val(),
      tanggal_update: $("#tanggal_update").val(),
      keterangan: $("#keterangan").val(),
    };

    const id = $("#stockId").val();
    const url = isEditMode
      ? `/api/stock-atm-buku/update/${id}`
      : "/api/stock-atm-buku/create";

    $.ajax({
      url: url,
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function (response) {
        if (response.success) {
          $("#stockModal").modal("hide");
          stockTable.ajax.reload();
          showAlert(
            "success",
            isEditMode
              ? "Stock berhasil diupdate"
              : "Stock berhasil ditambahkan"
          );
        } else {
          showAlert("danger", response.message || "Terjadi kesalahan");
        }
      },
      error: function (xhr) {
        showAlert("danger", "Gagal menyimpan data stock");
      },
    });
  });

  // View Button Click
  $(document).on("click", ".view-stock", function () {
    const id = $(this).data("id");

    $.ajax({
      url: `/api/stock-atm-buku/detail/${id}`,
      type: "GET",
      success: function (response) {
        if (response.success) {
          const data = response.data;
          $("#viewJenisItem").text(data.jenis_item || "-");
          $("#viewJenisAtm").text(data.jenis_atm || "-");
          $("#viewJumlah").text(data.jumlah || "0");
          $("#viewTanggalUpdate").text(
            data.tanggal_update
              ? new Date(data.tanggal_update).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "-"
          );
          $("#viewKeterangan").text(data.keterangan || "-");

          $("#viewStockModal").modal("show");
        }
      },
      error: function () {
        showAlert("danger", "Gagal memuat detail stock");
      },
    });
  });

  // Edit Button Click
  $(document).on("click", ".edit-stock", function () {
    const id = $(this).data("id");
    isEditMode = true;

    $.ajax({
      url: `/api/stock-atm-buku/detail/${id}`,
      type: "GET",
      success: function (response) {
        if (response.success) {
          const data = response.data;
          $("#stockModalLabel").text("Edit Stock");
          $("#stockId").val(data.id_stok);
          $("#jenis_item").val(data.jenis_item);
          $("#jenis_atm").val(data.jenis_atm);
          $("#jumlah").val(data.jumlah);
          $("#tanggal_update").val(data.tanggal_update);
          $("#keterangan").val(data.keterangan);

          $("#stockModal").modal("show");
        }
      },
      error: function () {
        showAlert("danger", "Gagal memuat data stock");
      },
    });
  });

  // Delete Button Click
  $(document).on("click", ".delete-stock", function () {
    const id = $(this).data("id");
    $("#deleteStockId").val(id);
    $("#deleteStockModal").modal("show");
  });

  // Confirm Delete
  $("#btnConfirmDelete").on("click", function () {
    const id = $("#deleteStockId").val();

    $.ajax({
      url: `/api/stock-atm-buku/delete/${id}`,
      type: "DELETE",
      success: function (response) {
        if (response.success) {
          $("#deleteStockModal").modal("hide");
          stockTable.ajax.reload();
          showAlert("success", "Stock berhasil dihapus");
        } else {
          showAlert("danger", response.message || "Gagal menghapus stock");
        }
      },
      error: function () {
        showAlert("danger", "Gagal menghapus stock");
      },
    });
  });

  // Initialize
  initDataTable();
});
