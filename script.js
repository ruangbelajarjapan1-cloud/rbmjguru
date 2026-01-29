/* LOGIC FULL SYSTEM RBM JAPAN - VERSI SMART MAPEL */

const API_URL = 'https://script.google.com/macros/s/AKfycbxetySGgJvC_cEA2ybFqy1HeZ_ut_Pj2SZLekpFiOihxzMCuFJBOvU1N54WiDEkD4bb/exec';

// -- STATE VARIABLES --
let currentTeacher = null;      // Nama Guru yang login
let currentTeacherMapel = [];   // Array Mapel milik guru tersebut
let rawDataGuru = [];           // Menyimpan data mentah guru dari Sheet
let rawDataRPP = [];
let rawDataSilabus = [];

// --- 1. INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    fetchData('getGuru', true); // Ambil data guru saat web dibuka
});

// --- 2. LOGIC LOGIN (DIPERBARUI) ---
function handleLogin() {
    const select = document.getElementById('login-guru-select');
    const selectedName = select.value;

    if (!selectedName) {
        alert("Mohon pilih nama pengajar terlebih dahulu.");
        return;
    }

    // 1. Cari Data Guru yang dipilih dari rawDataGuru
    const teacherData = rawDataGuru.find(g => g.Nama_Guru === selectedName);
    
    // 2. Simpan Nama
    currentTeacher = selectedName;
    
    // 3. Simpan & Proses Mapel Ajar (Pisahkan koma jadi Array)
    // Contoh: "Tajwid, Fiqih" menjadi ['Tajwid', 'Fiqih']
    if (teacherData && teacherData.Mapel_Ajar) {
        currentTeacherMapel = teacherData.Mapel_Ajar.toString().split(',').map(item => item.trim());
    } else {
        currentTeacherMapel = []; // Jaga-jaga jika kosong
    }

    // 4. Update UI Header
    updateUserProfile(currentTeacher);

    // 5. Pindah Halaman
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    showPage('dashboard');
}

function updateUserProfile(name) {
    document.getElementById('header-nama-guru').innerText = name;
    const initials = name.match(/\b\w/g) || [];
    document.getElementById('header-avatar').innerText = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
    document.getElementById('welcome-nama-guru').innerText = name;
    
    // Auto-fill hidden input di form
    document.getElementById('input-guru-hidden').value = name;
    document.getElementById('display-guru-form').innerText = name;
}

function handleLogout() {
    if(confirm("Apakah Anda yakin ingin keluar?")) {
        location.reload();
    }
}

// --- 3. NAVIGASI HALAMAN ---
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.getElementById('page-title').innerText = pageId.toUpperCase();

    // Logic per halaman
    if(pageId === 'rpp') fetchData('getRPP');
    if(pageId === 'silabus') fetchData('getSilabus');
    if(pageId === 'rapor') loadRapor();
    
    // KHUSUS HALAMAN PENILAIAN: Update Dropdown Mapel
    if(pageId === 'penilaian') {
        updateMapelDropdown();
    }
}

// --- FUNGSI BARU: UPDATE DROPDOWN MAPEL ---
function updateMapelDropdown() {
    const selectMapel = document.getElementById('input-mapel');
    selectMapel.innerHTML = ''; // Kosongkan dulu

    if (currentTeacherMapel.length === 0) {
        selectMapel.innerHTML = '<option value="">Belum ada mapel diatur di Sheet</option>';
        return;
    }

    // Masukkan Mapel milik guru tersebut saja
    currentTeacherMapel.forEach(mapel => {
        const option = document.createElement('option');
        option.value = mapel;
        option.innerText = mapel;
        selectMapel.appendChild(option);
    });
}


// --- 4. FETCH DATA ---
async function fetchData(action, isInitialLoad = false) {
    const loader = document.getElementById('loader');
    if(!isInitialLoad) loader.classList.remove('hidden');

    try {
        const response = await fetch(`${API_URL}?action=${action}`);
        const data = await response.json();
        
        if(!isInitialLoad) loader.classList.add('hidden');

        if (action === 'getGuru') {
            rawDataGuru = data; // Simpan data mentah ke variabel global
            populateLoginDropdown(data);
        }
        if (action === 'getRPP') {
            rawDataRPP = data;
            setupFilter('filter-rpp', data, 'Mata_Pelajaran');
            renderRPP(data);
        }
        if (action === 'getSilabus') {
            rawDataSilabus = data;
            setupFilter('filter-silabus', data, 'Mata_Pelajaran');
            renderSilabus(data);
        }
        if (action === 'getNilai') renderRapor(data);

    } catch (error) {
        console.error("Error:", error);
        if(isInitialLoad) document.getElementById('login-guru-select').innerHTML = '<option>Gagal memuat data.</option>';
    }
}

// --- 5. RENDER FUNCTIONS ---
function populateLoginDropdown(data) {
    const select = document.getElementById('login-guru-select');
    select.innerHTML = '<option value="">-- Pilih Nama Anda --</option>';
    data.forEach(item => {
        if(item.Nama_Guru) {
            const option = document.createElement('option');
            option.value = item.Nama_Guru;
            option.innerText = item.Nama_Guru;
            select.appendChild(option);
        }
    });
}

function setupFilter(id, data, key) {
    const select = document.getElementById(id);
    const unique = [...new Set(data.map(i => i[key]))];
    select.innerHTML = '<option value="all">Semua Mapel</option>';
    unique.forEach(val => {
        if(val) select.innerHTML += `<option value="${val}">${val}</option>`;
    });
}

function filterData(type) {
    const select = document.getElementById(`filter-${type}`);
    const val = select.value;
    if (type === 'rpp') {
        const filtered = val === 'all' ? rawDataRPP : rawDataRPP.filter(i => i.Mata_Pelajaran === val);
        renderRPP(filtered);
    } else if (type === 'silabus') {
        const filtered = val === 'all' ? rawDataSilabus : rawDataSilabus.filter(i => i.Mata_Pelajaran === val);
        renderSilabus(filtered);
    }
}

function renderRPP(data) {
    const tbody = document.querySelector('#table-rpp tbody');
    tbody.innerHTML = '';
    if(data.length === 0) { tbody.innerHTML = '<tr><td colspan="5">Data kosong</td></tr>'; return; }
    data.forEach(item => {
        tbody.innerHTML += `<tr><td style="font-weight:bold; color:#2F5D62">${item.Mata_Pelajaran||'-'}</td><td>${item.Pertemuan_Ke||'-'}</td><td>${item.Materi||'-'}</td><td>${item.Tujuan||'-'}</td><td>${item.Kegiatan||'-'}</td></tr>`;
    });
}

function renderSilabus(data) {
    const container = document.getElementById('silabus-container');
    container.innerHTML = '';
    if(data.length === 0) { container.innerHTML = '<p>Data kosong</p>'; return; }
    data.forEach(item => {
        container.innerHTML += `<div style="padding:15px; border-left:4px solid #D4AF37; background:#fff; margin-bottom:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><div style="display:flex; justify-content:space-between;"><b style="color:#2F5D62">${item.Mata_Pelajaran}</b><span style="color:#888; font-size:0.8rem">Pekan ${item.Pekan}</span></div><h4 style="margin:5px 0;">${item.Tema}</h4><p style="color:#555; font-size:0.9rem">🎯 ${item.Target_Hafalan}</p></div>`;
    });
}

function loadRapor() { fetchData('getNilai'); }
function renderRapor(data) {
    const tbody = document.querySelector('#table-rapor tbody');
    tbody.innerHTML = '';
    data.slice().reverse().forEach(item => {
        tbody.innerHTML += `<tr><td>${item.Nama_Siswa}</td><td>${item.Mata_Pelajaran}</td><td>${item.Nilai}</td><td>${item.Keterangan}</td><td style="font-size:0.8rem; color:#666">${item.Pengajar || '-'}</td></tr>`;
    });
}

// --- 6. SUBMIT FORM ---
document.getElementById('form-nilai').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.querySelector('.btn-gold');
    const originalText = btn.innerText;
    btn.innerText = "Menyimpan...";
    btn.disabled = true;

    const data = {
        nama: document.getElementById('input-nama').value,
        mapel: document.getElementById('input-mapel').value,
        nilai: document.getElementById('input-nilai').value,
        ket: document.getElementById('input-ket').value,
        guru: document.getElementById('input-guru-hidden').value
    };

    fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) })
    .then(() => {
        alert(`Alhamdulillah, Nilai ${data.mapel} berhasil disimpan!`);
        document.getElementById('form-nilai').reset();
        document.getElementById('input-guru-hidden').value = currentTeacher; // Restore nama guru
        btn.innerText = originalText;
        btn.disabled = false;
    })
    .catch(err => {
        alert("Gagal menyimpan.");
        btn.innerText = originalText;
        btn.disabled = false;
    });
});
