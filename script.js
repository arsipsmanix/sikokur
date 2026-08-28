// ==========================================
// 1. KONFIGURASI & STATE
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbz39TvSCyZyTim_f_8vsd0H93r25IJgnnUcZT8cK2qZDAlpQYqJtghRGdmBsKU1yl4/exec"; 

let state = {
  guru: "",
  kelas: "",
  siswa: [],
  adminData: null,
  currentJenjang: "ALL",
  semuaKelas: []
};

document.addEventListener("DOMContentLoaded", () => {
  loadDataAwal();
  
  // Set tanggal default Supervisi ke hari ini
  const datePicker = document.getElementById("filter-date-supervisi");
  if(datePicker) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    datePicker.value = `${yyyy}-${mm}-${dd}`;
  }
});

async function loadDataAwal() {
  const selectGuru = document.getElementById("select-guru");
  selectGuru.innerHTML = '<option value="">Sedang memuat data...</option>';

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getInitData", kelas: "X-1" })
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
      
      // Simpan list semua kelas dari HTML
      document.querySelectorAll("#select-kelas option").forEach(opt => {
        if (opt.value !== "") state.semuaKelas.push(opt.value);
      });
    } else {
      selectGuru.innerHTML = '<option value="">Gagal memuat data</option>';
    }
  } catch (error) {
    selectGuru.innerHTML = '<option value="">Koneksi bermasalah</option>';
  }
}

// ==========================================
// 2. NAVIGASI GURU & DASHBOARD
// ==========================================
document.getElementById("form-login").addEventListener("submit", async function(event) {
  event.preventDefault(); 
  
  const btnSubmit = event.target.querySelector('button[type="submit"]');
  btnSubmit.textContent = "Memuat...";
  btnSubmit.disabled = true;

  state.guru = document.getElementById("select-guru").value;
  state.kelas = document.getElementById("select-kelas").value;

  let teksHeader = `${state.kelas} | ${state.guru}`;
  document.getElementById("info-kelas-dashboard").textContent = teksHeader; 
  document.getElementById("info-kelas-presensi").textContent = teksHeader; 
  document.getElementById("info-kelas-penilaian").textContent = teksHeader; 

  document.getElementById("halaman-login").classList.add("hidden");
  document.getElementById("halaman-dashboard").classList.remove("hidden");

  await loadDataSiswa(state.kelas);
  
  btnSubmit.textContent = "Masuk ke Kelas";
  btnSubmit.disabled = false;
});

document.getElementById("menu-presensi").addEventListener("click", () => {
  document.getElementById("halaman-dashboard").classList.add("hidden");
  document.getElementById("halaman-presensi").classList.remove("hidden");
});

document.getElementById("menu-penilaian").addEventListener("click", () => {
  document.getElementById("halaman-dashboard").classList.add("hidden");
  document.getElementById("halaman-penilaian").classList.remove("hidden");
  loadKelompokUntukPenilaian();
});

document.getElementById("btn-keluar").addEventListener("click", () => {
  document.getElementById("halaman-dashboard").classList.add("hidden");
  document.getElementById("halaman-login").classList.remove("hidden");
});

const semuaTombolKembali = document.querySelectorAll(".btn-kembali-dashboard");
semuaTombolKembali.forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById("halaman-presensi").classList.add("hidden");
    document.getElementById("halaman-penilaian").classList.add("hidden");
    document.getElementById("halaman-dashboard").classList.remove("hidden");
  });
});

// ==========================================
// 3. FITUR PRESENSI & JURNAL (GURU)
// ==========================================
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
      renderListSiswaPresensi();
    } else {
      wadahSiswa.innerHTML = '<p class="text-red-500 text-sm text-center">Gagal memuat data.</p>';
    }
  } catch (error) {
    wadahSiswa.innerHTML = '<p class="text-red-500 text-sm text-center">Koneksi bermasalah.</p>';
  }
}

function renderListSiswaPresensi() {
  const wadahSiswa = document.getElementById("list-siswa");
  wadahSiswa.innerHTML = ""; 
  if (state.siswa.length === 0) {
    wadahSiswa.innerHTML = '<p class="text-sm text-orange-500 text-center py-4">Belum ada data siswa.</p>';
    return;
  }
  state.siswa.forEach(siswa => {
    const row = document.createElement("div");
    row.className = "flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition";
    row.innerHTML = `
      <div class="flex-1 pr-2">
        <p class="font-bold text-gray-800 text-sm">${siswa.nama}</p>
        <p class="text-[10px] text-gray-500 uppercase tracking-wide">${siswa.id_siswa}</p>
      </div>
      <div class="w-28 shrink-0">
        <select class="input-kehadiran w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 bg-white shadow-sm" data-idsiswa="${siswa.id_siswa}">
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

document.getElementById("form-presensi").addEventListener("submit", async function(event) {
  event.preventDefault(); 
  const tombolSimpan = event.target.querySelector('button[type="submit"]');
  const teksAsliTombol = tombolSimpan.textContent;
  
  const materi = document.getElementById("input-materi").value;
  let dataKehadiran = {};
  document.querySelectorAll(".input-kehadiran").forEach(select => {
    dataKehadiran[select.getAttribute("data-idsiswa")] = select.value;
  });

  tombolSimpan.textContent = "Menyimpan...";
  tombolSimpan.disabled = true;
  tombolSimpan.classList.replace("bg-blue-600", "bg-gray-400");

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
    if (result && result.status === "success") {
      alert("Sukses! Data presensi dan materi berhasil disimpan.");
      document.getElementById("halaman-presensi").classList.add("hidden");
      document.getElementById("halaman-dashboard").classList.remove("hidden");
      document.getElementById("form-presensi").reset();
    } else {
      alert("Gagal menyimpan: " + (result.message || "Error server"));
    }
  } catch (error) {
    alert("Koneksi bermasalah.");
  } finally {
    tombolSimpan.textContent = teksAsliTombol;
    tombolSimpan.disabled = false;
    tombolSimpan.classList.replace("bg-gray-400", "bg-blue-600");
  }
});

// ==========================================
// 4. FITUR PENILAIAN MULTI (GURU)
// ==========================================
async function loadKelompokUntukPenilaian() {
  const selectKelompok = document.getElementById("select-kelompok-penilaian");
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

// Event Listener ketika guru memilih kelompok (Munculkan daftar siswa)
document.getElementById("select-kelompok-penilaian").addEventListener("change", async function() {
  const idKel = this.value;
  const wadahNilai = document.getElementById("list-nilai-anggota");
  
  if(!idKel) {
    wadahNilai.innerHTML = "";
    return;
  }

  wadahNilai.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">Memuat anggota...</p>';

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getAnggotaKelompok", id_kelompok: idKel })
    });
    const result = await response.json();
    
    wadahNilai.innerHTML = "";
    if (result.status === "success" && result.data.length > 0) {
      result.data.forEach(siswa => {
        wadahNilai.innerHTML += `
          <div class="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <p class="font-semibold text-gray-800 text-sm flex-1 truncate pr-2">${siswa.nama}</p>
            <select class="input-nilai-individu w-28 shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none focus:ring-1 focus:ring-green-500" data-idsiswa="${siswa.id_siswa}">
              <option value="Berkembang" class="text-orange-600">Berkembang</option>
              <option value="Cakap" class="text-blue-600" selected>Cakap</option>
              <option value="Mahir" class="text-green-600">Mahir</option>
            </select>
          </div>
        `;
      });
    } else {
      wadahNilai.innerHTML = '<p class="text-xs text-red-500 text-center">Tidak ada anggota di kelompok ini.</p>';
    }
  } catch (error) {
    wadahNilai.innerHTML = '<p class="text-xs text-red-500 text-center">Gagal memuat anggota.</p>';
  }
});

document.getElementById("form-penilaian").addEventListener("submit", async function(event) {
  event.preventDefault(); 
  const tombolSimpan = event.target.querySelector('button[type="submit"]');
  const teksAsli = tombolSimpan.textContent;

  const sesi = document.getElementById("input-sesi-penilaian").value;
  const idKel = document.getElementById("select-kelompok-penilaian").value;
  const status = document.getElementById("select-status-progres").value;
  const nilaiKlp = document.getElementById("select-nilai-kelompok").value;
  const catatan = document.getElementById("input-catatan-progres").value;

  let nilaiIndividu = {};
  document.querySelectorAll(".input-nilai-individu").forEach(sel => {
    nilaiIndividu[sel.getAttribute("data-idsiswa")] = sel.value;
  });

  if(Object.keys(nilaiIndividu).length === 0) {
    return alert("Anggota kelompok belum termuat. Silakan pilih kelompok ulang.");
  }

  tombolSimpan.textContent = "Menyimpan Penilaian...";
  tombolSimpan.disabled = true;
  tombolSimpan.classList.replace("bg-green-600", "bg-gray-400");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "savePenilaianMulti",
        data: {
          id_kelompok: idKel,
          nama_sesi: sesi,
          status_kemajuan: status,
          nilai_kelompok: nilaiKlp,
          catatan: catatan,
          nama_guru: state.guru,
          nilai_anggota: nilaiIndividu
        }
      })
    });
    const result = await response.json();
    if (result.status === "success") {
      alert("Sukses! Penilaian kelompok & anggota berhasil disimpan.");
      document.getElementById("halaman-penilaian").classList.add("hidden");
      document.getElementById("halaman-dashboard").classList.remove("hidden");
      document.getElementById("form-penilaian").reset();
      document.getElementById("list-nilai-anggota").innerHTML = "";
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


// ==========================================
// 5. NAVIGASI ADMIN
// ==========================================
document.getElementById("btn-akses-admin").addEventListener("click", () => {
  document.getElementById("halaman-login").classList.add("hidden");
  document.getElementById("halaman-login-admin").classList.remove("hidden");
});

document.querySelector(".btn-batal-admin").addEventListener("click", () => {
  document.getElementById("halaman-login-admin").classList.add("hidden");
  document.getElementById("halaman-login").classList.remove("hidden");
});

document.getElementById("form-login-admin").addEventListener("submit", function(event) {
  event.preventDefault();
  const pass = document.getElementById("input-pass-admin").value;
  if(pass === "admin123") { // Ganti password sesuai kebutuhan
    document.getElementById("halaman-login-admin").classList.add("hidden");
    document.getElementById("halaman-admin-dashboard").classList.remove("hidden");
    document.getElementById("input-pass-admin").value = "";
    loadAdminData(); 
  } else {
    alert("Sandi akses salah!");
  }
});

document.getElementById("btn-keluar-admin").addEventListener("click", () => {
  document.getElementById("halaman-admin-dashboard").classList.add("hidden");
  document.getElementById("halaman-login").classList.remove("hidden");
});

// Fungsi buka halaman spesifik admin
function bukaAdminPage(pageId, callback = null) {
  document.getElementById("halaman-admin-dashboard").classList.add("hidden");
  document.getElementById(pageId).classList.remove("hidden");
  if(callback) callback();
}

// Tombol Kembali ke Dashboard Admin
document.querySelectorAll(".btn-kembali-admin").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.target.closest("div[id^='halaman-admin-']").classList.add("hidden");
    document.getElementById("halaman-admin-dashboard").classList.remove("hidden");
  });
});


// ==========================================
// 6. LOGIKA DATA ADMIN (SUPERVISI, JURNAL, PROGRES, KELOLA)
// ==========================================
async function loadAdminData() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getAdminData" })
    });
    const result = await response.json();
    
    if (result.status === "success") {
      state.adminData = result.data;
      
      // Isi Dropdown Filter Kelas
      const classOptions = '<option value="">-- Semua Kelas --</option>' + state.semuaKelas.map(k => `<option value="${k}">${k}</option>`).join('');
      
      document.getElementById("filter-kelas-jurnal").innerHTML = classOptions;
      document.getElementById("filter-kelas-progres").innerHTML = classOptions;
      document.getElementById("admin-proyek-kelas").innerHTML = '<option value="">- Kelas -</option>' + classOptions;
      document.getElementById("admin-kelompok-kelas").innerHTML = '<option value="">- Kelas -</option>' + classOptions;
      document.getElementById("admin-edit-kelas").innerHTML = '<option value="">- Kelas -</option>' + classOptions;

      renderSupervisi();
      renderRekapJurnal();
      renderRekapProgres();
    }
  } catch (error) {
    console.error("Error Admin:", error);
  }
}

// -- A. SUPERVISI HARIAN --
function filterJenjang(jenjang) {
  state.currentJenjang = jenjang;
  document.querySelectorAll('.btn-jenjang').forEach(btn => {
    if ((jenjang === 'ALL' && btn.textContent === 'Semua') || btn.textContent.includes(jenjang)) {
      btn.className = "btn-jenjang px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md transition";
    } else {
      btn.className = "btn-jenjang px-5 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-sm font-bold transition";
    }
  });
  renderSupervisi();
}

function renderSupervisi() {
  if (!state.adminData) return;
  const inputVal = document.getElementById("filter-date-supervisi").value; 
  if (!inputVal) return;

  const grid = document.getElementById("grid-supervisi");
  grid.innerHTML = "";

  const presensiHariIni = state.adminData.presensi.filter(p => String(p.tgl).includes(inputVal));

  const daftarKelasFiltered = state.semuaKelas.filter(kls => {
    let klsStr = String(kls).trim();
    if (state.currentJenjang === "ALL") return true;
    if (state.currentJenjang === "X" && klsStr.startsWith("X-")) return true;
    if (state.currentJenjang === "XI" && klsStr.startsWith("XI ")) return true; 
    if (state.currentJenjang === "XII" && klsStr.startsWith("XII ")) return true;
    return false;
  });

  daftarKelasFiltered.forEach(kls => {
    const reports = presensiHariIni.filter(p => String(p.kelas).trim() === String(kls).trim());
    const isReported = reports.length > 0;

    let cardHTML = `<div class="border rounded-2xl p-5 ${isReported ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
      <h4 class="font-black text-xl mb-3 text-gray-800">${kls}</h4>`;

    if (isReported) {
      const rep = reports[0];
      cardHTML += `
        <p class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded inline-block font-bold mb-2">✅ DILAPORKAN</p>
        <p class="text-xs text-gray-600 mb-1"><b>Guru:</b> ${reports.map(p => p.guru).join(", ")}</p>
        <p class="text-xs text-gray-600 mb-1"><b>Waktu:</b> ${rep.jam}</p>
        <p class="text-xs text-gray-700 mt-2 p-2 bg-white rounded border border-green-100 italic">"${rep.materi}"</p>
      `;
    } else {
      cardHTML += `<p class="text-sm text-red-600 font-bold mt-2">❌ Belum Ada Laporan</p>`;
    }
    cardHTML += `</div>`;
    grid.innerHTML += cardHTML;
  });
}

// -- B. REKAP JURNAL --
function renderRekapJurnal() {
  if(!state.adminData) return;
  const tbody = document.getElementById("tbody-rekap-jurnal");
  const kelasFilter = document.getElementById("filter-kelas-jurnal").value;
  tbody.innerHTML = "";
  
  let dataTampil = state.adminData.presensi;
  if(kelasFilter !== "") {
    dataTampil = dataTampil.filter(p => p.kelas === kelasFilter);
  }

  if(dataTampil.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-5 py-6 text-center text-gray-500">Tidak ada data untuk filter ini.</td></tr>';
    return;
  }
  
  dataTampil.forEach(p => {
    tbody.innerHTML += `
      <tr class="border-b border-gray-100 hover:bg-blue-50 transition">
        <td class="px-5 py-4 whitespace-nowrap"><span class="font-bold text-gray-800">${p.tgl}</span><br><span class="text-[11px] text-gray-500">${p.jam}</span></td>
        <td class="px-5 py-4 text-xs font-semibold uppercase text-gray-600">${p.guru}<br><span class="text-blue-600">${p.kelas}</span></td>
        <td class="px-5 py-4 text-xs text-gray-700 italic">"${p.materi}"</td>
        <td class="px-5 py-4 text-xs text-red-600 font-medium">${p.absen}</td>
      </tr>
    `;
  });
}

// -- C. REKAP PENILAIAN / PROGRES --
function renderRekapProgres() {
  if(!state.adminData) return;
  const tbody = document.getElementById("tbody-rekap-progres");
  const kelasFilter = document.getElementById("filter-kelas-progres").value;
  tbody.innerHTML = "";
  
  let dataTampil = state.adminData.progres;
  if(kelasFilter !== "") {
    dataTampil = dataTampil.filter(p => p.kelas === kelasFilter);
  }
  
  if(dataTampil.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-6 text-center text-gray-500">Tidak ada data untuk filter ini.</td></tr>';
    return;
  }
  
  dataTampil.forEach(p => {
    let statCol = "bg-gray-100 text-gray-800";
    if(p.status === "Selesai") statCol = "bg-green-100 text-green-800";
    else if(p.status === "Pelaksanaan") statCol = "bg-blue-100 text-blue-800";
    else if(p.status === "Perencanaan") statCol = "bg-yellow-100 text-yellow-800";
    
    let nlCol = p.nilai_kelompok === "Mahir" ? "text-green-600" : (p.nilai_kelompok === "Cakap" ? "text-blue-600" : "text-orange-600");

    tbody.innerHTML += `
      <tr class="border-b border-gray-100 hover:bg-green-50 transition">
        <td class="px-4 py-4 whitespace-nowrap text-xs"><span class="font-bold">${p.tgl.split(" ")[0]}</span><br><span class="text-gray-500">${p.sesi}</span></td>
        <td class="px-4 py-4 text-xs font-bold text-gray-700">${p.proyek}<br><span class="text-gray-400 font-normal">Kls: ${p.kelas}</span></td>
        <td class="px-4 py-4 text-xs"><span class="font-bold block mb-1">${p.kelompok}</span><span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide ${statCol}">${p.status}</span></td>
        <td class="px-4 py-4 text-xs"><span class="font-bold ${nlCol} block mb-1">Nilai: ${p.nilai_kelompok}</span><span class="text-gray-500 italic">"${p.catatan}"</span><br><span class="text-[10px] text-gray-400">By: ${p.guru}</span></td>
        <td class="px-4 py-4 text-[11px] text-gray-600 leading-relaxed">${p.nilai_individu_teks}</td>
      </tr>
    `;
  });
}

// -- D. KELOLA KELOMPOK & TEMA (ADMIN) --
document.getElementById("form-admin-proyek").addEventListener("submit", async function(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const txtAsli = btn.textContent;
  btn.textContent = "Menyimpan..."; btn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "saveProyekAdmin",
        data: {
          kelas: document.getElementById("admin-proyek-kelas").value,
          nama_proyek: document.getElementById("admin-proyek-nama").value
        }
      })
    });
    const result = await res.json();
    alert(result.message);
    e.target.reset();
  } catch (err) { alert("Error"); }
  btn.textContent = txtAsli; btn.disabled = false;
});

async function loadDataSiswaUntukKelompokAdmin() {
  const kls = document.getElementById("admin-kelompok-kelas").value;
  const wd = document.getElementById("admin-list-siswa-kelompok");
  const selPrj = document.getElementById("admin-kelompok-proyek");
  if(!kls) return alert("Pilih kelas dulu!");
  
  wd.innerHTML = "Memuat..."; selPrj.innerHTML = "<option>Memuat Proyek...</option>";
  
  try {
    const res1 = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getInitData", kelas: kls }) });
    const dataSiswa = await res1.json();
    const res2 = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getProyek", kelas: kls }) });
    const dataProyek = await res2.json();
    
    // Proyek Dropdown
    selPrj.innerHTML = '<option value="">-- Pilih Proyek --</option>';
    if(dataProyek.data) dataProyek.data.forEach(p => selPrj.innerHTML += `<option value="${p.id_proyek}">${p.nama_proyek}</option>`);
    
    // List Siswa Checkbox
    wd.innerHTML = "";
    const sedia = dataSiswa.data.siswa.filter(s => !s.id_kelompok);
    if(sedia.length === 0) { wd.innerHTML = "Semua siswa sudah ada kelompok."; return; }
    
    sedia.forEach(s => {
      wd.innerHTML += `
        <label class="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer border-b border-gray-100">
          <input type="checkbox" class="cb-admin-siswa w-4 h-4 text-purple-600" value="${s.id_siswa}">
          <span class="font-medium text-gray-700">${s.nama}</span>
        </label>`;
    });
  } catch (e) { wd.innerHTML = "Gagal memuat."; }
}

document.getElementById("form-admin-kelompok").addEventListener("submit", async function(e) {
  e.preventDefault();
  let anggota = [];
  document.querySelectorAll(".cb-admin-siswa:checked").forEach(cb => anggota.push(cb.value));
  if(anggota.length === 0) return alert("Centang minimal 1 siswa!");

  const btn = e.target.querySelector('button[type="submit"]');
  const txtAsli = btn.textContent;
  btn.textContent = "Menyimpan..."; btn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "saveKelompokAdmin",
        data: {
          kelas: document.getElementById("admin-kelompok-kelas").value,
          id_proyek: document.getElementById("admin-kelompok-proyek").value,
          nama_kelompok: document.getElementById("admin-kelompok-nama").value,
          anggota: anggota
        }
      })
    });
    const result = await res.json();
    alert(result.message);
    document.getElementById("admin-kelompok-nama").value = "";
    loadDataSiswaUntukKelompokAdmin(); // Refresh list
  } catch (err) { alert("Error"); }
  btn.textContent = txtAsli; btn.disabled = false;
});

// -- E. EDIT / RE-ALOKASI KELOMPOK --
let editState = { siswa: [], kelompok: [] };
async function loadEditKelompok() {
  const kls = document.getElementById("admin-edit-kelas").value;
  const tbody = document.getElementById("tbody-edit-kelompok");
  if (!kls) return alert("Pilih kelas!");
  
  tbody.innerHTML = '<tr><td colspan="2" class="px-3 py-4 text-center text-xs">Memuat...</td></tr>';
  
  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getEditKelompokData", kelas: kls }) });
    const data = await res.json();
    editState.siswa = data.data.siswa; editState.kelompok = data.data.kelompok;
    
    tbody.innerHTML = "";
    let optKel = '<option value="">-- Kosong --</option>' + editState.kelompok.map(k => `<option value="${k.id_kelompok}">${k.nama_kelompok}</option>`).join('');
    
    editState.siswa.forEach(s => {
      let tr = document.createElement("tr"); tr.className = "border-b hover:bg-orange-50";
      tr.innerHTML = `
        <td class="px-3 py-2 font-semibold text-gray-800">${s.nama}</td>
        <td class="px-3 py-2 flex gap-1 items-center">
          <select id="edit-kel-${s.id_siswa}" class="w-full bg-white border border-gray-300 rounded p-1 text-xs outline-none">${optKel}</select>
          <button onclick="simpanEditKlp('${s.id_siswa}')" class="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-orange-600">Simpan</button>
        </td>
      `;
      tbody.appendChild(tr);
      document.getElementById(`edit-kel-${s.id_siswa}`).value = s.id_kelompok;
    });
  } catch (e) { tbody.innerHTML = '<tr><td colspan="2" class="text-center text-red-500">Error</td></tr>'; }
}

async function simpanEditKlp(idSiswa) {
  const newVal = document.getElementById(`edit-kel-${idSiswa}`).value;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "updateSiswaKelompok", data: { id_siswa: idSiswa, id_kelompok: newVal } })
    });
    const result = await res.json();
    if(result.status === "success") alert("Sukses diupdate!");
  } catch(e) { alert("Gagal update"); }
}

// ==========================================
// 7. CETAK LAPORAN
// ==========================================
function cetakLaporan(jenis) {
  const printTitle = document.getElementById("print-title");
  const printSubtitle = document.getElementById("print-subtitle");
  const printContent = document.getElementById("print-content");
  
  const kelasDipilih = document.getElementById('filter-kelas-' + jenis).value || "Seluruh Kelas";
  printSubtitle.innerText = "Kelas: " + kelasDipilih;

  if (jenis === 'jurnal') {
    printTitle.innerText = "LAPORAN JURNAL & PRESENSI KOKURIKULER";
    printContent.innerHTML = document.querySelector("#halaman-admin-jurnal table").outerHTML;
  } else if (jenis === 'progres') {
    printTitle.innerText = "LAPORAN HISTORI PENILAIAN PROYEK";
    printContent.innerHTML = document.querySelector("#halaman-admin-progres table").outerHTML;
  }
  
  printContent.querySelector("table").className = "print-table";
  window.print();
}
