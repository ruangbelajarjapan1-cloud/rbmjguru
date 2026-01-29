/* LOGIC FRONTEND RBM JAPAN
*/

// GANTI URL INI DENGAN URL APPS SCRIPT ANDA (HASIL DEPLOY)
const API_URL = 'https://script.google.com/macros/s/AKfycbxetySGgJvC_cEA2ybFqy1HeZ_ut_Pj2SZLekpFiOihxzMCuFJBOvU1N54WiDEkD4bb/exec';

// Navigasi Halaman
function showPage(pageId) {
    // ... kode sembunyikan section (biarkan yang lama) ...
    // ... kode hapus active menu (biarkan yang lama) ...
    
    document.getElementById(pageId).classList.remove('hidden');
    document.getElementById('page-title').innerText = pageId.toUpperCase();
    
    // Logic khusus per halaman
    if(pageId === 'rpp') fetchData('getRPP');
    if(pageId === 'silabus') fetchData('getSilabus');
    if(pageId === 'rapor') loadRapor();
    
    // TAMBAHAN BARU:
    if(pageId === 'penilaian') fetchData('getGuru'); 
}
// Variabel Global untuk menyimpan data mentah
let rawDataRPP = [];
let rawDataSilabus = [];

async function fetchData(action) {
    // ... kode loader (biarkan) ...
    
    try {
        const response = await fetch(`${API_URL}?action=${action}`);
        const data = await response.json();
        
        // ... kode hide loader (biarkan) ...
        
        if (action === 'getRPP') { ... } // biarkan
        if (action === 'getSilabus') { ... } // biarkan
        if (action === 'getNilai') renderRapor(data);
        
        // TAMBAHAN BARU:
        if (action === 'getGuru') renderGuruOptions(data); 

    } catch (error) { ... }
}

// Fungsi Mengisi Dropdown Filter Secara Otomatis
function setupFilter(elementId, data, key) {
    const select = document.getElementById(elementId);
    // Ambil daftar mapel unik (tidak duplikat)
    const uniqueMapel = [...new Set(data.map(item => item[key]))];
    
    // Reset isi dropdown, sisakan 'Semua Mapel'
    select.innerHTML = '<option value="all">Semua Mapel</option>';
    
    // Masukkan mapel yang ditemukan
    uniqueMapel.forEach(mapel => {
        if(mapel) { // Cek biar tidak ada mapel kosong
            const option = document.createElement('option');
            option.value = mapel;
            option.innerText = mapel;
            select.appendChild(option);
        }
    });
}

// Fungsi Filter saat Dropdown Dipilih
function filterData(type) {
    if (type === 'rpp') {
        const selected = document.getElementById('filter-rpp').value;
        // Jika pilih 'all', pakai semua data. Jika tidak, filter berdasarkan mapel.
        const filtered = selected === 'all' 
            ? rawDataRPP 
            : rawDataRPP.filter(item => item.Mata_Pelajaran === selected);
        renderRPP(filtered);
    }
    
    if (type === 'silabus') {
        const selected = document.getElementById('filter-silabus').value;
        const filtered = selected === 'all' 
            ? rawDataSilabus 
            : rawDataSilabus.filter(item => item.Mata_Pelajaran === selected);
        renderSilabus(filtered);
    }
}

// Render RPP (Update kolom Mapel)
function renderRPP(data) {
    const tbody = document.querySelector('#table-rpp tbody');
    tbody.innerHTML = '';
    
    if(data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Data tidak ditemukan</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = `<tr>
            <td>${item.Mata_Pelajaran}</td>
            <td>${item.Pertemuan_Ke}</td>
            <td>${item.Materi}</td>
            <td>${item.Tujuan}</td>
            <td>${item.Kegiatan}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Render Silabus (Update Tampilan Card)
function renderSilabus(data) {
    const container = document.getElementById('silabus-container');
    container.innerHTML = '';
    
    if(data.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Data tidak ditemukan</p>';
        return;
    }

    data.forEach(item => {
        const card = `<div style="padding:15px; border-left:4px solid var(--gold-accent); background:#fff; margin-bottom:15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-radius: 0 8px 8px 0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <small style="color:var(--primary-green); font-weight:bold; text-transform:uppercase;">${item.Mata_Pelajaran}</small>
                <small style="color:#888;">Pekan ke-${item.Pekan}</small>
            </div>
            <h4 style="margin:5px 0;">${item.Tema}</h4>
            <p style="font-size:0.9rem; color:#555;">🎯 Target: ${item.Target_Hafalan}</p>
        </div>`;
        container.innerHTML += card;
    });
}
// Render Rapor
function loadRapor() {
    fetchData('getNilai');
}

function renderRapor(data) {
    const tbody = document.querySelector('#table-rapor tbody');
    tbody.innerHTML = '';
    data.forEach(item => {
        const row = `<tr>
            <td>${item.Nama_Siswa}</td>
            <td>${item.Mata_Pelajaran}</td>
            <td>${item.Nilai}</td>
            <td>${item.Keterangan}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Handle Form Submit (Input Nilai)
document.getElementById('form-nilai').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.querySelector('.btn-gold');
    btn.innerText = "Menyimpan...";
    
    const data = {
        nama: document.getElementById('input-nama').value,
        mapel: document.getElementById('input-mapel').value,
        nilai: document.getElementById('input-nilai').value,
        ket: document.getElementById('input-ket').value
    };

    // Kirim ke Backend (Gunakan no-cors untuk bypass isu browser sederhana)
    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify(data)
    }).then(() => {
        alert("Alhamdulillah, Nilai berhasil disimpan!");
        document.getElementById('form-nilai').reset();
        btn.innerText = "Simpan Nilai";
    }).catch(err => {
        alert("Gagal menyimpan.");
        console.error(err);
    });
});

// Load awal
showPage('dashboard');
function renderGuruOptions(data) {
    const select = document.getElementById('input-guru');
    
    // Reset isi dropdown
    select.innerHTML = '<option value="">-- Pilih Pengajar --</option>';
    
    // Masukkan nama guru dari Sheet
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.Nama_Guru;
        option.innerText = item.Nama_Guru;
        select.appendChild(option);
    });
}
