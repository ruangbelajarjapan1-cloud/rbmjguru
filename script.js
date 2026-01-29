/* LOGIC FRONTEND RBM JAPAN
*/

// GANTI URL INI DENGAN URL APPS SCRIPT ANDA (HASIL DEPLOY)
const API_URL = 'https://script.google.com/macros/s/AKfycbxetySGgJvC_cEA2ybFqy1HeZ_ut_Pj2SZLekpFiOihxzMCuFJBOvU1N54WiDEkD4bb/exec';

// Navigasi Halaman
function showPage(pageId) {
    // Sembunyikan semua section
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    // Hapus aktif di menu
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    
    // Tampilkan yang dipilih
    document.getElementById(pageId).classList.remove('hidden');
    
    // Update Judul
    document.getElementById('page-title').innerText = pageId.toUpperCase();
    
    // Logic khusus per halaman
    if(pageId === 'rpp') fetchData('getRPP');
    if(pageId === 'silabus') fetchData('getSilabus');
    if(pageId === 'rapor') loadRapor();
}

// Fungsi Fetch Data dari Google Sheets
async function fetchData(action) {
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_URL}?action=${action}`);
        const data = await response.json();
        
        loader.classList.add('hidden');
        
        if (action === 'getRPP') renderRPP(data);
        if (action === 'getSilabus') renderSilabus(data);
        if (action === 'getNilai') renderRapor(data);
        
    } catch (error) {
        loader.innerText = "Gagal mengambil data. Cek koneksi.";
        console.error(error);
    }
}

// Render Tabel RPP
function renderRPP(data) {
    const tbody = document.querySelector('#table-rpp tbody');
    tbody.innerHTML = '';
    data.forEach(item => {
        const row = `<tr>
            <td>${item.Pertemuan_Ke}</td>
            <td>${item.Materi}</td>
            <td>${item.Tujuan}</td>
            <td>${item.Kegiatan}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Render Silabus (Card View)
function renderSilabus(data) {
    const container = document.getElementById('silabus-container');
    container.innerHTML = '';
    data.forEach(item => {
        const card = `<div style="padding:15px; border-left:4px solid var(--gold-accent); background:#f9f9f9; margin-bottom:10px;">
            <h4>Pekan ${item.Pekan}: ${item.Tema}</h4>
            <p>Target: ${item.Target_Hafalan}</p>
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
