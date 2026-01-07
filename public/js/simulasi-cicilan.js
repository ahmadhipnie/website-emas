/**
 * Simulasi Cicilan Emas
 * Kalkulator cicilan pembelian emas dengan integrasi Google Sheets
 */

// ==========================================
// KONFIGURASI
// ==========================================

// GANTI INI dengan URL Google Apps Script Web App Anda
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzhshVZSEhoywpewMlro1WOVMCJJgmf3eBDXs6dLvjPyuYwX07eZZ9hFBpSzZez1tT4vg/exec";

// ==========================================
// STATE MANAGEMENT
// ==========================================

let hasilSimulasi = null;
let riwayatSimulasi = [];

// ==========================================
// FORMATTING HELPERS
// ==========================================

// Format angka ke IDR
function formatIDR(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Parse IDR string ke number
function parseIDR(value) {
  if (typeof value === "number") return value;
  return parseInt(value.replace(/[^0-9]/g, "")) || 0;
}

// Format tanggal
function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// ==========================================
// KALKULASI SIMULASI
// ==========================================

function hitungSimulasi() {
  // Ambil nilai dari form
  const hargaBeliEmas = parseIDR(
    document.getElementById("hargaBeliEmas").value
  );
  const beratEmas = parseFloat(document.getElementById("beratEmas").value);
  const hargaBuyBack = parseIDR(document.getElementById("hargaBuyBack").value);
  const tanggalUpdate = document.getElementById("tanggalUpdate").value;

  // Validasi input
  if (!hargaBeliEmas || !beratEmas || !tanggalUpdate) {
    showToast("Mohon lengkapi semua field!", "error");
    return null;
  }

  // Kalkulasi sesuai sistem NON PAYROLL
  let dp, pembiayaan;

  // KASUS KHUSUS: Untuk 100 gram, pembiayaan fixed Rp150.000.000
  if (beratEmas === 100) {
    pembiayaan = 150000000; // Pembiayaan statis untuk 100 gram
    dp = hargaBeliEmas - pembiayaan; // DP = Harga Beli - 150.000.000
  } else {
    // Untuk berat lain: DP = 5% × Harga Beli Emas
    dp = hargaBeliEmas * 0.05;
    // Pembiayaan = Harga Beli Emas – DP
    pembiayaan = hargaBeliEmas - dp;
  }

  // 3. Adm = 0.25% × Pembiayaan
  const adm = pembiayaan * 0.0025;

  // 4. Materai = Rp10.000 (tetap)
  const materai = 10000;

  // 5. Total Uang Muka (DP) = DP + Adm + 10.000
  const totalUangMuka = dp + adm + materai;

  // 6. Hitung angsuran untuk semua tenor (12, 24, 36, 48, 60 bulan)
  // Menggunakan rumus PMT (Anuitas) seperti Excel:
  // =PMT(rate, nper, pv) = pv * rate * (1 + rate)^nper / ((1 + rate)^nper - 1)
  // Dimana:
  // - rate = bunga per bulan (9.5% / 12)
  // - nper = jumlah periode (tenor dalam bulan)
  // - pv = present value (pembiayaan)
  const bungaPersen = 9.5;
  const rate = bungaPersen / 100 / 12; // Bunga per bulan
  const tenors = [12, 24, 36, 48, 60];
  const angsuranPerTenor = {};

  tenors.forEach((tenor) => {
    // Rumus PMT (Anuitas)
    const angsuran =
      (pembiayaan * rate * Math.pow(1 + rate, tenor)) /
      (Math.pow(1 + rate, tenor) - 1);
    angsuranPerTenor[tenor] = angsuran;
  });

  // Format tanggal ke format Indonesia
  const tanggalObj = new Date(tanggalUpdate);
  const tanggalUpdateFormatted = formatDateIndo(tanggalObj);

  // Simpan hasil
  hasilSimulasi = {
    tanggal: new Date().toISOString(),
    tanggalUpdate: tanggalUpdateFormatted,
    tanggalUpdateRaw: tanggalUpdate,
    hargaBeliEmas: hargaBeliEmas,
    beratEmas: beratEmas,
    hargaBuyBack: hargaBuyBack || 0,
    dp: dp,
    pembiayaan: pembiayaan,
    adm: adm,
    materai: materai,
    totalUangMuka: totalUangMuka,
    bungaPersen: bungaPersen,
    angsuranPerTenor: angsuranPerTenor,
  };

  return hasilSimulasi;
}

// Format tanggal ke format Indonesia (DD MMMM YYYY)
function formatDateIndo(date) {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// ==========================================
// TAMPILKAN HASIL
// ==========================================

function tampilkanHasil(hasil) {
  // Hide placeholder, show hasil
  document.getElementById("hasilContainer").style.display = "none";
  document.getElementById("hasilPerhitungan").style.display = "block";

  // Format angka dengan 2 desimal untuk angsuran, 0 desimal untuk harga utama
  const formatIDR2Decimal = (value) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatIDR0Decimal = (value) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Update nilai utama
  document.getElementById("hargaBeliEmasDisplay").textContent =
    formatIDR0Decimal(hasil.hargaBeliEmas);
  document.getElementById("dpDisplay").textContent = formatIDR0Decimal(
    hasil.dp
  );
  document.getElementById("pembiayaanDisplay").textContent = formatIDR0Decimal(
    hasil.pembiayaan
  );
  document.getElementById("admDisplay").textContent = formatIDR0Decimal(
    hasil.adm
  );
  document.getElementById("materaiDisplay").textContent = formatIDR0Decimal(
    hasil.materai
  );
  document.getElementById("totalUangMukaDisplay").textContent =
    formatIDR0Decimal(hasil.totalUangMuka);

  // Update angsuran per tenor
  document.getElementById("angsuran12Display").textContent = formatIDR2Decimal(
    hasil.angsuranPerTenor[12]
  );
  document.getElementById("angsuran24Display").textContent = formatIDR2Decimal(
    hasil.angsuranPerTenor[24]
  );
  document.getElementById("angsuran36Display").textContent = formatIDR2Decimal(
    hasil.angsuranPerTenor[36]
  );
  document.getElementById("angsuran48Display").textContent = formatIDR2Decimal(
    hasil.angsuranPerTenor[48]
  );
  document.getElementById("angsuran60Display").textContent = formatIDR2Decimal(
    hasil.angsuranPerTenor[60]
  );

  // Update rincian biaya (display2 elements)
  document.getElementById("hargaBeliEmasDisplay2").textContent =
    formatIDR0Decimal(hasil.hargaBeliEmas);
  document.getElementById("dpDisplay2").textContent = formatIDR0Decimal(
    hasil.dp
  );
  document.getElementById("pembiayaanDisplay2").textContent = formatIDR0Decimal(
    hasil.pembiayaan
  );
  document.getElementById("totalUangMukaDisplay2").textContent =
    formatIDR0Decimal(hasil.totalUangMuka);

  // Update ringkasan
  const ringkasan = document.getElementById("ringkasanSimulasi");
  ringkasan.innerHTML = `
    <li><strong>Tanggal:</strong> ${hasil.tanggalUpdate}</li>
    <li><strong>Berat Emas:</strong> ${hasil.beratEmas} gram</li>
    <li><strong>Harga Beli Emas:</strong> ${formatIDR0Decimal(
      hasil.hargaBeliEmas
    )}</li>
    <li><strong>DP (5%):</strong> ${formatIDR0Decimal(hasil.dp)}</li>
    <li><strong>Pembiayaan:</strong> ${formatIDR0Decimal(hasil.pembiayaan)}</li>
    <li><strong>Administrasi (0.25%):</strong> ${formatIDR0Decimal(
      hasil.adm
    )}</li>
    <li><strong>Materai:</strong> ${formatIDR0Decimal(hasil.materai)}</li>
    <li><strong>Total Uang Muka:</strong> ${formatIDR0Decimal(
      hasil.totalUangMuka
    )}</li>
    <li><strong>Margin/Bunga:</strong> ${
      hasil.bungaPersen
    }% per tahun (flat)</li>
  `;

  // Tampilkan harga buy back hanya jika berat = 2 gram
  if (hasil.beratEmas === 2 && hasil.hargaBuyBack > 0) {
    document.getElementById("hargaBuyBackDisplay").textContent =
      formatIDR0Decimal(hasil.hargaBuyBack);
    document.getElementById("hargaBuyBackRow").style.display = "table-row";
  } else {
    document.getElementById("hargaBuyBackRow").style.display = "none";
  }

  // Enable tombol simpan
  document.getElementById("btnSimpan").disabled = false;
}

// ==========================================
// KIRIM KE GOOGLE SHEETS
// ==========================================

async function kirimKeSpreadsheet(data) {
  try {
    showToast("Sedang menyimpan data...", "info");

    // Persiapkan data untuk dikirim ke spreadsheet
    const payload = {
      timestamp: new Date().toISOString(),
      tanggal_update: data.tanggalUpdate,
      berat_emas: data.beratEmas,
      harga_beli_emas: data.hargaBeliEmas,
      dp: data.dp,
      pembiayaan: data.pembiayaan,
      adm: data.adm,
      materai: data.materai,
      total_uang_muka: data.totalUangMuka,
      angsuran_12: data.angsuranPerTenor[12],
      angsuran_24: data.angsuranPerTenor[24],
      angsuran_36: data.angsuranPerTenor[36],
      angsuran_48: data.angsuranPerTenor[48],
      angsuran_60: data.angsuranPerTenor[60],
      bunga_persen: data.bungaPersen,
      harga_buy_back: data.beratEmas === 2 ? data.hargaBuyBack : "",
      sales: sessionStorage.getItem("userName") || "System",
    };

    // Kirim ke Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Untuk bypass CORS
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Karena mode 'no-cors', kita tidak bisa baca response
    // Tapi kita asumsikan berhasil jika tidak throw error
    console.log("Data sent to spreadsheet:", payload);

    showToast("Data berhasil disimpan ke spreadsheet!", "success");
    return true;
  } catch (error) {
    console.error("Error sending to spreadsheet:", error);
    showToast("Gagal menyimpan ke spreadsheet: " + error.message, "error");
    return false;
  }
}

// ==========================================
// RIWAYAT SIMULASI
// ==========================================

function tambahKeRiwayat(data) {
  // Tambah ke array riwayat
  riwayatSimulasi.unshift(data);

  // Batasi riwayat hanya 10 item terakhir
  if (riwayatSimulasi.length > 10) {
    riwayatSimulasi = riwayatSimulasi.slice(0, 10);
  }

  // Update tampilan tabel
  updateTabelRiwayat();
}

function updateTabelRiwayat() {
  const tbody = document.getElementById("riwayatBody");

  if (riwayatSimulasi.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted">Belum ada simulasi</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = riwayatSimulasi
    .map(
      (item) => `
    <tr>
      <td>${item.tanggalUpdate || formatDate(new Date(item.tanggal))}</td>
      <td>${item.beratEmas} gram</td>
      <td>${formatIDR(item.hargaBeliEmas)}</td>
      <td>${formatIDR(item.totalUangMuka)}</td>
      <td>12 bln: ${formatIDR(item.angsuranPerTenor[12])}</td>
      <td>${formatIDR(item.angsuranPerTenor[60])}</td>
      <td>
        <span class="badge bg-${
          item.status === "Tersimpan" ? "success" : "warning"
        }">
          ${item.status}
        </span>
      </td>
    </tr>
  `
    )
    .join("");
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================

function showToast(message, type = "info") {
  // Hapus toast yang sudah ada
  const existingToast = document.querySelector(".simulasi-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Buat toast baru
  const toast = document.createElement("div");
  toast.className = `simulasi-toast alert alert-${
    type === "success" ? "success" : type === "error" ? "danger" : "info"
  } position-fixed`;
  toast.style.cssText =
    "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
  toast.textContent = message;

  document.getElementById("toastContainer").appendChild(toast);

  // Auto remove setelah 3 detik
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  // Tombol Hitung
  document.getElementById("btnHitung").addEventListener("click", function () {
    const hasil = hitungSimulasi();
    if (hasil) {
      tampilkanHasil(hasil);
      showToast(
        'Perhitungan berhasil! Klik "Simpan" untuk menyimpan ke spreadsheet.',
        "success"
      );
    }
  });

  // Tombol Simpan
  document
    .getElementById("btnSimpan")
    .addEventListener("click", async function () {
      if (!hasilSimulasi) {
        showToast("Hitung simulasi terlebih dahulu!", "error");
        return;
      }

      // Kirim ke spreadsheet
      const berhasil = await kirimKeSpreadsheet(hasilSimulasi);

      if (berhasil) {
        // Tandai sebagai tersimpan
        hasilSimulasi.status = "Tersimpan";
        tambahKeRiwayat(hasilSimulasi);

        // Disable tombol simpan
        document.getElementById("btnSimpan").disabled = true;

        // Tampilkan spreadsheet otomatis setelah simpan
        if (typeof showSpreadsheetAfterSave === 'function') {
          showSpreadsheetAfterSave();
        }

        // Reset form (opsional - comment jika ingin reset)
        // document.getElementById('simulasiForm').reset();
        // hasilSimulasi = null;
      }
    });

  // Auto-format input harga beli emas
  document
    .getElementById("hargaBeliEmas")
    .addEventListener("input", function (e) {
      let value = e.target.value.replace(/[^0-9]/g, "");
      if (value) {
        e.target.value = parseInt(value).toLocaleString("id-ID");
      }
    });

  // Auto-format input harga buy back
  document
    .getElementById("hargaBuyBack")
    .addEventListener("input", function (e) {
      let value = e.target.value.replace(/[^0-9]/g, "");
      if (value) {
        e.target.value = parseInt(value).toLocaleString("id-ID");
      }
    });

  // Load harga emas terbaru dari dashboard (jika ada)
  loadHargaEmasTerbaru();
});

// ==========================================
// LOAD HARGA EMAS DARI DASHBOARD
// ==========================================

async function loadHargaEmasTerbaru() {
  try {
    const response = await fetch("/api/emas/latest");
    const result = await response.json();

    if (result.success && result.data) {
      const hargaPerGram = result.data.price / 31.1034768; // Convert toz to gram
      // Note: Ini akan mengisi field harga beli emas untuk 1 gram
      // User perlu mengalikan sendiri sesuai berat yang diinginkan
      document.getElementById("hargaBeliEmas").value =
        Math.round(hargaPerGram).toLocaleString("id-ID");
      console.log(
        "Harga emas diupdate dari dashboard:",
        formatIDR(hargaPerGram)
      );
    }
  } catch (error) {
    console.error("Gagal load harga emas:", error);
    // Gunakan default value jika gagal
  }
}
