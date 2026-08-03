// 1. Simpan URL API dari Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbz39TvSCyZyTim_f_8vsd0H93r25IJgnnUcZT8cK2qZDAlpQYqJtghRGdmBsKU1yl4/exec"; 

// 2. Event Listener: Menjalankan fungsi saat halaman web pertama kali selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  loadDataAwal();
});

// 3. Fungsi untuk mengambil data dari backend (GAS)
async function loadDataAwal() {
  const selectGuru = document.getElementById("select-guru");
  selectGuru.innerHTML = '<option value="">Sedang memuat data...</option>';

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getInitData", 
        kelas: "X-1" 
      })
    });

    const result = await response.json();

    if (result.status === "success") {
      selectGuru.innerHTML = '<option value="">-- Pilih Nama --</option>';
      result.data.guru.forEach(nama => {
        let opsi = document.createElement("option");
        opsi.value = nama;
        opsi.textContent = nama;
        selectGuru.appendChild(opsi);
      });
    } else {
      selectGuru.innerHTML = '<option value="">Gagal memuat data</option>';
    }
  } catch (error) {
    console.error("Error mengambil data:", error);
    selectGuru.innerHTML = '<option value="">Koneksi bermasalah</option>';
  }
}

// VARIABEL STATE
let state = {
  guru: "",
  kelas: "",
  siswa: [],
  adminData: null // Baru: untuk menyimpan data admin
};

// 4. Logika Tombol "Masuk ke Kelas" (Menuju Dashboard)
document.getElementById("form-login").addEventListener("submit", async function(event) {
  event.preventDefault(); 
  
  state.guru = document.getElementById("select-guru").value;
  state.kelas = document.getElementById("select-kelas").value;

  let teksHeader = `${state.kelas} | ${state.guru}`;
  document.getElementById("info-kelas").textContent = teksHeader; 
  document.getElementById("info-kelas-dashboard").textContent = teksHeader; 
  document.getElementById("info-kelas-proyek").textContent = teksHeader; 
  document.getElementById("info-kelas-kelompok").textContent = teksHeader; 
  document.getElementById("info-kelas-progres").textContent = teksHeader; 

  document.getElementById("halaman-login").classList.add("hidden");
  document.getElementById("halaman-dashboard").classList.remove("hidden");

  await loadDataSiswa(state.kelas);
});

// =====================================
// NAVIGASI DASHBOARD 
// =====================================
document.getElementById("menu-presensi").addEventListener("click", () => {
  document.getElementById("halaman-dashboard").classList.add("hidden");
  document.getElementById("halaman-presensi").classList.remove("hidden");
});

document.getElementById("menu-proyek").addEventListener("click", () => {
  document.getElementById("halaman-dashboard").classList.add("hidden");
  document.getElementById("halaman-proyek").classList.remove("hidden");
});

document.getElementById("menu-kelompok").addEventListener("click", () => {
  document.getElementById("halaman-dashboard").classList.add("hidden");
  document.getElementById("halaman-kelompok").classList.remove("hidden");
  renderSiswaKelompok(); 
  loadProyekKelas();
});

document.getElementById("menu-progres").addEventListener("click", () => {
  document.getElementById("halaman-dashboard").classList.add("hidden");
  document.getElementById("halaman-progres").classList.remove("hidden");
  loadKelompokProgres();
});

document.getElementById("btn-keluar").addEventListener("click", () => {
  document.getElementById("halaman-dashboard").classList.add("hidden");
  document.getElementById("halaman-login").classList.remove("hidden");
});

// =====================================
// NAVIGASI ADMIN 
// =====================================
document.getElementById("btn-akses-admin").addEventListener("click", () => {
  document.getElementById("halaman-login").classList.add("hidden");
  document.getElementById("halaman-login-admin").classList.remove("hidden");
});

document.querySelector(".btn-batal-admin").addEventListener("click", () => {
  document.getElementById("halaman-login-admin").classList.add("hidden");
  document.getElementById("halaman-login").classList.remove("hidden");
});

document.getElementById("btn-keluar-admin").addEventListener("click", () => {
  document.getElementById("halaman-admin").classList.add("hidden");
  document.getElementById("halaman-login").classList.remove("hidden");
});

// 5. Fungsi Mengambil Data Siswa dari GAS
async function loadDataSiswa(kelasTarget) {
  const wadahSiswa = document.getElementById("list-siswa");
  wadahSiswa.innerHTML = '<p class="text-sm text-gray-500 text-center italic py-4">Menarik data siswa...</p>';

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getInitData", kelas: kelasTarget })
    });
    const result = await response.json();
    if (result.status === "success") {
      state.siswa = result.data.siswa;
      renderListSiswa();
    } else {
      wadahSiswa.innerHTML = '<p class="text-red-500 text-sm text-center">Gagal memuat data.</p>';
    }
  } catch (error) {
    wadahSiswa.innerHTML = '<p class="text-red-500 text-sm text-center">Koneksi bermasalah.</p>';
  }
}

// 6. Fungsi Menampilkan Siswa ke Layar
function renderListSiswa() {
  const wadahSiswa = document.getElementById("list-siswa");
  wadahSiswa.innerHTML = ""; 
  if (state.siswa.length === 0) {
    wadahSiswa.innerHTML = '<p class="text-sm text-orange-500 text-center py-4">Belum ada data siswa di kelas ini.</p>';
    return;
  }
  state.siswa.forEach(siswa => {
    const row = document.createElement("div");
    row.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200";
    row.innerHTML = `
      <div class="flex-1 pr-2">
        <p class="font-semibold text-gray-800 text-sm">${siswa.nama}</p>
        <p class="text-xs text-gray-500">${siswa.id_siswa}</p>
      </div>
      <div class="w-24 shrink-0">
        <select class="input-kehadiran w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 font-medium" data-idsiswa="${siswa.id_siswa}">
          <option value="Hadir" selected>Hadir</option>
          <option value="Sakit">Sakit</option>
          <option value="Izin">Izin</option>
          <option value="Alpa">Alpa</option>
          <option value="Rekom">Rekom</option>
        </select>
      </div>
    `;
    wadahSiswa.appendChild(row);
  });
}

// 7. Tombol Kembali ke Dashboard (Berlaku untuk semua tombol kembali)
const semuaTombolKembali = document.querySelectorAll(".btn-kembali-dashboard");
semuaTombolKembali.forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById("halaman-presensi").classList.add("hidden");
    document.getElementById("halaman-proyek").classList.add("hidden");
    document.getElementById("halaman-kelompok").classList.add("hidden");
    document.getElementById("halaman-progres").classList.add("hidden");
    document.getElementById("halaman-dashboard").classList.remove("hidden");
  });
});

// 8. Logika Simpan Presensi 
document.getElementById("form-presensi").addEventListener("submit", async function(event) {
  event.preventDefault(); 
  const tombolSimpan = event.target.querySelector('button[type="submit"]');
  const teksAsliTombol = tombolSimpan.textContent;
  
  const materi = document.getElementById("input-materi").value;
  let dataKehadiran = {};
  document.querySelectorAll(".input-kehadiran").forEach(select => {
    dataKehadiran[select.getAttribute("data-idsiswa")] = select.value;
  });

  tombolSimpan.textContent = "Menyimpan Data...";
  tombolSimpan.disabled = true;
  tombolSimpan.classList.replace("bg-green-600", "bg-gray-400");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "savePresensi",
        data: {
          kelas: state.kelas,
          jam: "Jam Kokurikuler", 
          nama_guru: state.guru,
          materi: materi,
          kehadiran: dataKehadiran
        }
      })
    });
    const result = await response.json();
    if (result.status === "success") {
      alert("Hore! Data presensi dan materi berhasil disimpan ke sistem.");
      document.getElementById("halaman-presensi").classList.add("hidden");
      document.getElementById("halaman-dashboard").classList.remove("hidden");
      document.getElementById("form-presensi").reset();
    } else {
      alert("Gagal menyimpan: " + result.message);
    }
  } catch (error) {
    alert("Koneksi bermasalah. Pastikan internet lancar.");
  } finally {
    tombolSimpan.textContent = teksAsliTombol;
    tombolSimpan.disabled = false;
    tombolSimpan.classList.replace("bg-gray-400", "bg-green-600");
  }
});

// 9. Logika Simpan Inisiasi Proyek Baru
document.getElementById("form-proyek").addEventListener("submit", async function(event) {
  event.preventDefault(); 
  const tombolSimpan = event.target.querySelector('button[type="submit"]');
  const teksAsli = tombolSimpan.textContent;
  const namaProyek = document.getElementById("input-nama-proyek").value;

  tombolSimpan.textContent = "Menyimpan Proyek...";
  tombolSimpan.disabled = true;
  tombolSimpan.classList.replace("bg-indigo-600", "bg-gray-400");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "saveProyek",
        data: { nama_proyek: namaProyek, kelas: state.kelas }
      })
    });
    const result = await response.json();
    if (result.status === "success") {
      alert(`Proyek "${namaProyek}" berhasil didaftarkan ke sistem!`);
      document.getElementById("halaman-proyek").classList.add("hidden");
      document.getElementById("halaman-dashboard").classList.remove("hidden");
      document.getElementById("form-proyek").reset();
    } else {
      alert("Gagal menyimpan: " + result.message);
    }
  } catch (error) {
    alert("Koneksi bermasalah. Pastikan internet lancar.");
  } finally {
    tombolSimpan.textContent = teksAsli;
    tombolSimpan.disabled = false;
    tombolSimpan.classList.replace("bg-gray-400", "bg-indigo-600");
  }
});

// 10. Fungsi Menampilkan Siswa untuk Dipilih (Filter Menyala)
function renderSiswaKelompok() {
  const wadahSiswa = document.getElementById("list-siswa-kelompok");
  wadahSiswa.innerHTML = ""; 
  if (state.siswa.length === 0) {
    wadahSiswa.innerHTML = '<p class="text-sm text-red-500 font-semibold text-center py-4">Sistem gagal memuat data siswa.</p>';
    return;
  }
  const siswaTersedia = state.siswa.filter(s => !s.id_kelompok || String(s.id_kelompok).trim() === "");
  if (siswaTersedia.length === 0) {
    wadahSiswa.innerHTML = '<p class="text-sm text-green-600 font-semibold text-center py-4">Semua siswa di kelas ini sudah masuk kelompok!</p>';
    return;
  }
  siswaTersedia.forEach(siswa => {
    const row = document.createElement("label"); 
    row.className = "flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition";
    row.innerHTML = `
      <input type="checkbox" class="checkbox-siswa w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500" value="${siswa.id_siswa}">
      <div class="flex-1">
        <p class="font-semibold text-gray-800 text-sm">${siswa.nama}</p>
        <p class="text-xs text-gray-500">${siswa.id_siswa}</p>
      </div>
    `;
    wadahSiswa.appendChild(row);
  });
}

// 11. Fungsi Mengambil Daftar Proyek
async function loadProyekKelas() {
  const selectProyek = document.getElementById("select-proyek-kelompok");
  selectProyek.innerHTML = '<option value="">-- Memuat Proyek... --</option>';
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getProyek", kelas: state.kelas })
    });
    const result = await response.json();
    if (result.status === "success" && result.data.length > 0) {
      selectProyek.innerHTML = '<option value="">-- Pilih Proyek --</option>';
      result.data.forEach(proyek => {
        let opsi = document.createElement("option");
        opsi.value = proyek.id_proyek; 
        opsi.textContent = proyek.nama_proyek;
        selectProyek.appendChild(opsi);
      });
    } else {
      selectProyek.innerHTML = '<option value="">Belum ada proyek di kelas ini</option>';
    }
  } catch (error) {
    selectProyek.innerHTML = '<option value="">Gagal terhubung</option>';
  }
}

// 12. Logika Simpan Pembagian Kelompok
document.getElementById("form-kelompok").addEventListener("submit", async function(event) {
  event.preventDefault(); 
  const tombolSimpan = event.target.querySelector('button[type="submit"]');
  const teksAsli = tombolSimpan.textContent;
  const idProyek = document.getElementById("select-proyek-kelompok").value;
  const namaKelompok = document.getElementById("input-nama-kelompok").value;

  let anggotaTerpilih = [];
  document.querySelectorAll(".checkbox-siswa:checked").forEach(cb => anggotaTerpilih.push(cb.value));

  if (anggotaTerpilih.length === 0) return alert("Wah, anggotanya masih kosong. Centang minimal satu siswa ya!");

  tombolSimpan.textContent = "Menyimpan...";
  tombolSimpan.disabled = true;
  tombolSimpan.classList.replace("bg-purple-600", "bg-gray-400");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "saveKelompok",
        data: {
          id_proyek: idProyek,
          nama_kelompok: namaKelompok,
          anggota: anggotaTerpilih,
          kelas: state.kelas
        }
      })
    });
    const result = await response.json();
    if (result.status === "success") {
      alert(`Mantap! Kelompok "${namaKelompok}" berhasil disimpan.`);
      state.siswa = state.siswa.map(s => {
        if (anggotaTerpilih.includes(String(s.id_siswa))) s.id_kelompok = "SUDAH_ADA_KELOMPOK"; 
        return s;
      });
      document.getElementById("input-nama-kelompok").value = "";
      renderSiswaKelompok(); 
    } else {
      alert("Gagal menyimpan: " + result.message);
    }
  } catch (error) {
    alert("Koneksi bermasalah.");
  } finally {
    tombolSimpan.textContent = teksAsli;
    tombolSimpan.disabled = false;
    tombolSimpan.classList.replace("bg-gray-400", "bg-purple-600");
  }
});

// =====================================
// HALAMAN PROGRES 
// =====================================

// 13. Load Data Kelompok untuk Dropdown Progres
async function loadKelompokProgres() {
  const selectKelompok = document.getElementById("select-kelompok-progres");
  selectKelompok.innerHTML = '<option value="">-- Memuat Kelompok... --</option>';
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getKelompok", kelas: state.kelas })
    });
    const result = await response.json();
    if (result.status === "success" && result.data.length > 0) {
      selectKelompok.innerHTML = '<option value="">-- Pilih Kelompok --</option>';
      result.data.forEach(kel => {
        let opsi = document.createElement("option");
        opsi.value = kel.id_kelompok; 
        opsi.textContent = `${kel.nama_kelompok} (${kel.nama_proyek})`;
        selectKelompok.appendChild(opsi);
      });
    } else {
      selectKelompok.innerHTML = '<option value="">Belum ada kelompok di kelas ini</option>';
    }
  } catch (error) {
    selectKelompok.innerHTML = '<option value="">Gagal terhubung</option>';
  }
}

// 14. Simpan Progres
document.getElementById("form-progres").addEventListener("submit", async function(event) {
  event.preventDefault(); 
  const tombolSimpan = event.target.querySelector('button[type="submit"]');
  const teksAsli = tombolSimpan.textContent;

  const idKel = document.getElementById("select-kelompok-progres").value;
  const status = document.getElementById("select-status-progres").value;
  const catatan = document.getElementById("input-catatan-progres").value;

  tombolSimpan.textContent = "Menyimpan...";
  tombolSimpan.disabled = true;
  tombolSimpan.classList.replace("bg-green-600", "bg-gray-400");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "saveProgres",
        data: {
          id_kelompok: idKel,
          status_kemajuan: status,
          catatan: catatan,
          nama_guru: state.guru
        }
      })
    });
    const result = await response.json();
    if (result.status === "success") {
      alert("Progres kelompok berhasil disimpan!");
      document.getElementById("halaman-progres").classList.add("hidden");
      document.getElementById("halaman-dashboard").classList.remove("hidden");
      document.getElementById("form-progres").reset();
    } else {
      alert("Gagal menyimpan: " + result.message);
    }
  } catch (error) {
    alert("Koneksi bermasalah.");
  } finally {
    tombolSimpan.textContent = teksAsli;
    tombolSimpan.disabled = false;
    tombolSimpan.classList.replace("bg-gray-400", "bg-green-600");
  }
});

// =====================================
// HALAMAN ADMIN 
// =====================================

document.getElementById("form-login-admin").addEventListener("submit", function(event) {
  event.preventDefault();
  const pass = document.getElementById("input-pass-admin").value;
  if(pass === "admin123") {
    document.getElementById("halaman-login-admin").classList.add("hidden");
    document.getElementById("halaman-admin").classList.remove("hidden");
    document.getElementById("input-pass-admin").value = "";
    loadAdminData(); 
  } else {
    alert("Sandi salah!");
  }
});

function switchAdminTab(tabId) {
  document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');
  
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.className = "admin-tab-btn px-4 py-2 font-semibold text-gray-500 hover:bg-gray-100 rounded-t-lg transition";
  });
  const activeBtn = document.getElementById('btn-' + tabId);
  activeBtn.className = "admin-tab-btn px-4 py-2 font-semibold text-blue-600 border-b-2 border-blue-600 rounded-t-lg bg-blue-50";
}

// --- 1. Fungsi Menarik Data Admin (Sudah Dilengkapi Trigger Perubahan Tanggal) ---
async function loadAdminData() {
  const datePicker = document.getElementById("filter-date-supervisi");
  
  // Set tanggal default ke hari ini
  if (!datePicker.value) {
    datePicker.value = new Date().toISOString().split('T')[0];
  }

  // SANGAT PENTING: Trigger agar kotak update otomatis saat kalender diklik/diubah
  datePicker.addEventListener("change", function() {
    renderSupervisi();
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getAdminData" })
    });
    const result = await response.json();
    
    if (result.status === "success") {
      state.adminData = result.data;
      
      // Ambil daftar kelas otomatis dari pilihan di halaman login
      let semuaKelas = [];
      document.querySelectorAll("#select-kelas option").forEach(opt => {
        if (opt.value !== "") semuaKelas.push(opt.value);
      });
      state.adminData.daftarKelas = semuaKelas; 
      
      renderSupervisi();
      renderRekapJurnal();
      renderRekapProgres();
    }
  } catch (error) {
    console.error("Error Admin:", error); // Bantuan log untuk cek di browser
    alert("Gagal menarik data admin dari Google Sheets");
  }
}

// --- 2. Fungsi Menampilkan Kotak Supervisi (Algoritma Pembersih Tanggal Absolut) ---
function renderSupervisi() {
  if (!state.adminData) return;

  const inputVal = document.getElementById("filter-date-supervisi").value; // Nilai HTML: "YYYY-MM-DD"
  if (!inputVal) return;

  const grid = document.getElementById("grid-supervisi");
  grid.innerHTML = "";

  // Filter presensi dengan algoritma pembersihan string
  const presensiHariIni = state.adminData.presensi.filter(p => {
    if (!p.tgl) return false;
    let tStr = String(p.tgl);

    // Cek 1: Jika string mentahnya langsung mengandung format inputVal
    if (tStr.includes(inputVal)) return true;

    // Cek 2: Konversi ke Format Baku
    try {
      // Potong paksa teks aneh seperti "(Waktu Indochina)" agar tidak error
      let cleanStr = tStr.split('(')[0].trim();
      let d = new Date(cleanStr);

      // Jika berhasil jadi format Waktu yang valid
      if (!isNaN(d.getTime())) {
        let yyyy = d.getFullYear();
        let mm = String(d.getMonth() + 1).padStart(2, '0');
        let dd = String(d.getDate()).padStart(2, '0');
        
        let normalizedDate = `${yyyy}-${mm}-${dd}`; // Jadikan YYYY-MM-DD
        
        if (normalizedDate === inputVal) return true;
      }
    } catch(e) {
      console.log("Error parsing date:", e);
    }

    return false;
  });

  const kelasTeraport = presensiHariIni.map(p => String(p.kelas).trim());

  state.adminData.daftarKelas.forEach(kls => {
    const isReported = kelasTeraport.includes(String(kls).trim());
    const reportData = isReported ? presensiHariIni.find(p => String(p.kelas).trim() === String(kls).trim()) : null;

    let cardHTML = `<div class="border rounded-xl p-4 ${isReported ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
      <h4 class="font-bold text-lg mb-2">${kls}</h4>`;

    if (isReported) {
      cardHTML += `
        <p class="text-sm text-green-700 font-semibold mb-1">✅ Telah Dilaporkan</p>
        <p class="text-xs text-gray-600"><b>Guru:</b> ${reportData.guru}</p>
        <p class="text-xs text-gray-600"><b>Waktu:</b> ${reportData.jam}</p>
        <p class="text-xs text-gray-600 mt-1 italic">"${reportData.materi}"</p>
        <div class="mt-2 pt-2 border-t border-green-200">
          <p class="text-xs text-red-600 font-medium"><b>Tidak Hadir:</b> ${reportData.absen}</p>
        </div>
      `;
    } else {
      cardHTML += `<p class="text-sm text-red-600 font-semibold">❌ Belum Ada Laporan</p>`;
    }
    cardHTML += `</div>`;
    grid.innerHTML += cardHTML;
  });
}

function renderRekapJurnal() {
  if(!state.adminData) return;
  const tbody = document.getElementById("tbody-rekap-jurnal");
  tbody.innerHTML = "";
  
  if(state.adminData.presensi.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-3 text-center">Belum ada data jurnal.</td></tr>';
    return;
  }
  state.adminData.presensi.forEach(p => {
    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-3 whitespace-nowrap">${p.tgl}<br><span class="text-xs text-gray-400">${p.jam}</span></td>
        <td class="px-4 py-3 font-semibold">${p.kelas}</td>
        <td class="px-4 py-3">${p.guru}</td>
        <td class="px-4 py-3 text-xs">${p.materi}</td>
      </tr>
    `;
  });
}

function renderRekapProgres() {
  if(!state.adminData) return;
  const tbody = document.getElementById("tbody-rekap-progres");
  tbody.innerHTML = "";
  
  if(state.adminData.progres.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-center">Belum ada data progres.</td></tr>';
    return;
  }
  state.adminData.progres.forEach(p => {
    let statusColor = "bg-gray-100 text-gray-800";
    if(p.status === "Selesai") statusColor = "bg-green-100 text-green-800";
    else if(p.status === "Pelaksanaan") statusColor = "bg-blue-100 text-blue-800";
    else if(p.status === "Perencanaan") statusColor = "bg-yellow-100 text-yellow-800";

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-3 whitespace-nowrap">${p.tgl}</td>
        <td class="px-4 py-3 font-semibold text-xs">
          ${p.proyek}<br><span class="text-gray-400">Kelas: ${p.kelas}</span>
        </td>
        <td class="px-4 py-3">${p.kelompok}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">${p.status}</span>
        </td>
        <td class="px-4 py-3 text-xs">
          ${p.catatan}<br><span class="text-gray-400 italic">(${p.guru})</span>
        </td>
      </tr>
    `;
  });
}

function cetakLaporan(jenis) {
  const printTitle = document.getElementById("print-title");
  const printContent = document.getElementById("print-content");
  
  if (jenis === 'jurnal') {
    printTitle.innerText = "LAPORAN JURNAL & PRESENSI KOKURIKULER";
    const tableHTML = document.querySelector("#tab-jurnal table").outerHTML;
    printContent.innerHTML = tableHTML;
  } else if (jenis === 'progres') {
    printTitle.innerText = "LAPORAN EVALUASI PROGRES PROYEK";
    const tableHTML = document.querySelector("#tab-progres table").outerHTML;
    printContent.innerHTML = tableHTML;
  }
  
  const table = printContent.querySelector("table");
  table.className = "print-table";
  window.print();
}
