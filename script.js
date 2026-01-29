/* LOGIC FRONTEND RBM JAPAN 
   Updated for Wahyu - Full Version
*/

// URL API DARI APPS SCRIPT ANDA
const API_URL = 'https://script.google.com/macros/s/AKfycbxetySGgJvC_cEA2ybFqy1HeZ_ut_Pj2SZLekpFiOihxzMCuFJBOvU1N54WiDEkD4bb/exec';

// Variabel Global untuk menyimpan data mentah (untuk fitur filter)
let rawDataRPP = [];
let rawDataSilabus = [];

// --- 1. NAVIGASI HALAMAN ---
function showPage(pageId) {
    // Sembunyikan semua section
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    
    // Hapus class 'active' dari semua menu sidebar
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    
    // Tampilkan halaman yang dipilih
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // Update Judul Halaman
    document.getElementById('page-title').innerText = pageId.toUpperCase();
    
    // Highlight menu yang aktif (opsional, perlu penyesuaian ID di HTML jika mau presisi)
    // Untuk saat ini kita lewati highlight menu otomatis biar simpel
    
    // Logika khusus: Ambil data sesuai halaman yang dibuka
    if(pageId === 'rpp') fetchData('getRPP');
    if(pageId === 'silabus') fetchData('getSilabus');
    if(pageId === 'rapor') loadRapor();
    
    // Jika halaman Penilaian dibuka, ambil data Guru
    if(pageId === 'penilaian') fetchData('getGuru'); 
}

// --- 2. FUNGSI FETCH DATA (AMBIL DATA) ---
async function fetchData(action) {
    const loader = document.getElementById('loader');
    if(loader) loader.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_URL}?action=${action}`);
        const data = await response.json();
        
        if(loader) loader.classList.add('hidden');
        
        // Routing Data ke Fungsi Render yang sesuai
        if (action === 'getRPP') {
            rawDataRPP = data; // Simpan ke global var
            setupFilter('filter-rpp', data, 'Mata_Pelajaran'); // Siapkan filter
            renderRPP(data); // Tampilkan tabel
        }
        
        if (action === 'getSilabus') {
            rawDataSilabus = data;
            setupFilter('filter-silabus', data, 'Mata_Pelajaran');
            renderSilabus(data);
        }
        
        if (action === 'getNilai') {
            renderRapor(data);
        }
        
        if (action === 'getGuru') {
            renderGuruOptions(data);
        }
        
    } catch (error) {
        if(loader) loader.innerText = "Gagal mengambil data. Cek koneksi.";
        console.error("Error fetching data:", error);
    }
}

// --- 3. LOGIKA FILTER (DROPDOWN MAPEL) ---
function setupFilter(elementId, data, key) {
    const select = document.getElementById(elementId);
    if (!select) return; // Cegah error jika elemen tidak ada
    
    // Ambil daftar mapel unik
    const uniqueMapel = [...new Set(data.map(item => item[key]))];
    
    // Reset isi dropdown
    select.innerHTML = '<option value="all">Semua Mapel</option>';
    
    // Masukkan pilihan ke dropdown
    uniqueMapel.forEach(mapel => {
        if(mapel) {
            const option = document.createElement('option');
            option.value = mapel;
            option.innerText = mapel;
            select.appendChild(option);
        }
    });
}

function filterData(type) {
    if (type === 'rpp') {
        const select = document.getElementById('filter-rpp');
        const selected = select ? select.value : 'all';
        
        const filtered = selected === 'all' 
            ? rawDataRPP 
            : rawDataRPP.filter(item => item.Mata_Pelajaran === selected);
        renderRPP(filtered);
    }
    
    if (type === 'silabus') {
        const select = document.getElementById('filter-silabus');
        const selected = select ? select.value : 'all';
        
        const filtered = selected === 'all' 
            ? rawDataSilabus 
            : rawDataSilabus.filter(item => item.Mata_Pelajaran === selected);
        renderSilabus(filtered);
    }
}

// --- 4. RENDER DATA KE HTML ---

// Tampilkan Tabel RPP
function renderRPP(data) {
    const tbody = document.querySelector('#table-rpp tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    
    if(data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Data tidak ditemukan</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = `<tr>
            <td>${item.Mata_Pelajaran || '-'}</td>
            <td>${item.Pertemuan_Ke || '-'}</td>
            <td>${item.Materi || '-'}</td>
            <td>${item.Tujuan || '-'}</td>
            <td>${item.Kegiatan || '-'}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Tampilkan Kartu Silabus
function renderSilabus(data) {
    const container = document.getElementById('silabus-container');
    if(!container) return;
    
    container.innerHTML = '';
    
    if(data.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Data tidak ditemukan</p>';
        return;
    }

    data.forEach(item => {
        const card = `<div style="padding:15px; border-left:4px solid var(--gold-accent); background:#fff; margin-bottom:15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-radius: 0 8px 8px 0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <small style="color:var(--primary-green); font-weight:bold; text-transform:uppercase;">${item.Mata_Pelajaran || 'Umum'}</small>
                <small style="color:#888;">Pekan ke-${item.Pekan || '-'}</small>
            </div>
            <h4 style="margin:5px 0;">${item.Tema || 'Tanpa Tema'}</h4>
            <p style="font-size:0.9rem; color:#555;">🎯 Target: ${item.Target_Hafalan || '-'}</p>
        </div>`;
        container.innerHTML += card;
    });
}

// Load Rapor Wrapper
function loadRapor() {
    fetchData('getNilai');
}

// Tampilkan Tabel Rapor
function renderRapor(data) {
    const tbody = document.querySelector('#table-rapor tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    data.forEach(item => {
        const row = `<tr>
            <td>${item.Nama_Siswa || '-'}</td>
            <td>${item.Mata_Pelajaran || '-'}</td>
            <td>${item.Nilai || '0'}</td>
            <td>${item.Keterangan || '-'}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Tampilkan Pilihan Guru di Dropdown
function renderGuruOptions(data) {
    const select = document.getElementById('input-guru');
    if(!select) return;
    
    // Reset isi dropdown
    select.innerHTML = '<option value="">-- Pilih Pengajar --</option>';
    
    // Masukkan nama guru dari Sheet
    data.forEach(item => {
        if(item.Nama_Guru) {
            const option = document.createElement('option');
            option.value = item.Nama_Guru;
            option.innerText = item.Nama_Guru;
            select.appendChild(option);
        }
    });
}

// --- 5. HANDLE SUBMIT FORM (INPUT NILAI) ---
const formNilai = document.getElementById('form-nilai');
if (formNilai) {
    formNilai.addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = document.querySelector('.btn-gold');
        const originalText = btn.innerText;
        btn.innerText = "Menyimpan...";
        btn.disabled = true;
        
        // Ambil data dari form (termasuk Guru)
        const data = {
            nama: document.getElementById('input-nama').value,
            mapel: document.getElementById('input-mapel').value,
            nilai: document.getElementById('input-nilai').value,
            ket: document.getElementById('input-ket').value,
            guru: document.getElementById('input-guru').value // Ambil value guru
        };

        // Kirim ke Backend
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: JSON.stringify(data)
        }).then(() => {
            alert("Alhamdulillah, Nilai berhasil disimpan!");
            document.getElementById('form-nilai').reset();
            btn.innerText = originalText;
            btn.disabled = false;
        }).catch(err => {
            alert("Gagal menyimpan data.");
            console.error(err);
            btn.innerText = originalText;
            btn.disabled = false;
        });
    });
}

// --- 6. INITIALIZATION (JALAN SAAT PERTAMA BUKA) ---
// Buka dashboard saat pertama kali load
document.addEventListener('DOMContentLoaded', () => {
    showPage('dashboard');
});
