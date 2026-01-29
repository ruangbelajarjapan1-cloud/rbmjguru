/* LOGIC RBM JAPAN - VERSI MOBILE & MULTI-BAHASA */

const API_URL = 'https://script.google.com/macros/s/AKfycbxetySGgJvC_cEA2ybFqy1HeZ_ut_Pj2SZLekpFiOihxzMCuFJBOvU1N54WiDEkD4bb/exec';

// -- 1. KAMUS BAHASA (TRANSLATION DICTIONARY) --
const translations = {
    id: {
        login_welcome: "Ahlan wa Sahlan",
        login_desc: "Silakan pilih profil pengajar",
        loading: "Memuat...",
        btn_enter: "Masuk Aplikasi",
        menu_dashboard: "🏠 Dashboard",
        menu_rpp: "📚 RPP",
        menu_silabus: "📜 Silabus",
        menu_nilai: "✍️ Input Nilai",
        menu_rapor: "📊 Rapor Siswa",
        btn_logout: "Keluar",
        greeting: "Assalamu'alaikum",
        dashboard_msg: "Selamat bertugas mendidik generasi Rabbani.",
        col_mapel: "Mapel",
        col_meet: "Pertemuan",
        col_materi: "Materi",
        col_tujuan: "Tujuan",
        col_kegiatan: "Kegiatan",
        title_input: "Input Penilaian",
        label_siswa: "Nama Siswa",
        label_mapel: "Mata Pelajaran",
        label_nilai: "Nilai (0-100)",
        label_ket: "Keterangan",
        btn_save: "Simpan Nilai",
        info_guru: "Data disimpan oleh:",
        alert_select_guru: "Pilih nama pengajar dulu.",
        alert_save_success: "Alhamdulillah, data tersimpan!",
        confirm_logout: "Yakin ingin keluar?"
    },
    en: {
        login_welcome: "Welcome",
        login_desc: "Please select teacher profile",
        loading: "Loading...",
        btn_enter: "Enter App",
        menu_dashboard: "🏠 Dashboard",
        menu_rpp: "📚 Lesson Plan",
        menu_silabus: "📜 Syllabus",
        menu_nilai: "✍️ Input Grade",
        menu_rapor: "📊 Report Card",
        btn_logout: "Logout",
        greeting: "Peace be upon you",
        dashboard_msg: "Good luck in educating the Rabbani generation.",
        col_mapel: "Subject",
        col_meet: "Meeting",
        col_materi: "Topic",
        col_tujuan: "Goal",
        col_kegiatan: "Activity",
        title_input: "Input Grade",
        label_siswa: "Student Name",
        label_mapel: "Subject",
        label_nilai: "Score (0-100)",
        label_ket: "Notes",
        btn_save: "Save Grade",
        info_guru: "Saved by:",
        alert_select_guru: "Please select a teacher first.",
        alert_save_success: "Data saved successfully!",
        confirm_logout: "Are you sure you want to logout?"
    },
    jp: {
        login_welcome: "ようこそ",
        login_desc: "講師プロフィールを選択してください",
        loading: "読み込み中...",
        btn_enter: "アプリに入る",
        menu_dashboard: "🏠 ダッシュボード",
        menu_rpp: "📚 指導案 (RPP)",
        menu_silabus: "📜 シラバス",
        menu_nilai: "✍️ 成績入力",
        menu_rapor: "📊 成績表",
        btn_logout: "ログアウト",
        greeting: "アッサラーム・アライクム",
        dashboard_msg: "ラッバーニ世代の教育、頑張ってください。",
        col_mapel: "科目",
        col_meet: "回",
        col_materi: "トピック",
        col_tujuan: "目標",
        col_kegiatan: "活動内容",
        title_input: "成績入力",
        label_siswa: "生徒名",
        label_mapel: "科目",
        label_nilai: "点数 (0-100)",
        label_ket: "備考",
        btn_save: "保存する",
        info_guru: "入力者:",
        alert_select_guru: "講師名を選択してください。",
        alert_save_success: "保存しました！",
        confirm_logout: "ログアウトしますか？"
    }
};

let currentLang = 'id'; // Default Bahasa
let currentTeacher = null;
let currentTeacherMapel = [];
let rawDataGuru = [];
let rawDataRPP = [];
let rawDataSilabus = [];

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    fetchData('getGuru', true);
    fetchData('getSiswa', true);
    // Set bahasa default di dropdown
    document.getElementById('lang-select-login').value = currentLang;
});

// --- FUNGSI GANTI BAHASA ---
function changeLanguage(lang) {
    currentLang = lang;
    
    // Update Dropdown di kedua tempat (Login & Sidebar)
    document.getElementById('lang-select-login').value = lang;
    document.getElementById('lang-select-sidebar').value = lang;

    // Cari semua elemen yang punya atribut 'data-lang'
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    // Update Placeholder Input (Manual karena placeholder adalah atribut)
    const phMap = {
        id: { siswa: "-- Pilih Siswa --", ket: "Catatan singkat" },
        en: { siswa: "-- Select Student --", ket: "Short notes" },
        jp: { siswa: "-- 生徒を選択 --", ket: "短いメモ" }
    };
    
    const inputSiswa = document.getElementById('input-nama');
    if(inputSiswa && inputSiswa.options[0]) inputSiswa.options[0].innerText = phMap[lang].siswa;
    
    const inputKet = document.getElementById('input-ket');
    if(inputKet) inputKet.placeholder = phMap[lang].ket;
}

// --- FUNGSI TOGGLE SIDEBAR (MENU HP) ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

// --- LOGIC LAINNYA (SAMA SEPERTI SEBELUMNYA) ---
function handleLogin() {
    const select = document.getElementById('login-guru-select');
    const inputPin = document.getElementById('login-pin').value; // Ambil PIN yang diketik
    const selectedName = select.value;

    if (!selectedName) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: translations[currentLang].alert_select_guru, confirmButtonColor: '#D4AF37' });
        return;
    }

    // Cari data guru
    const teacherData = rawDataGuru.find(g => g.Nama_Guru === selectedName);

    // --- LOGIKA CEK PIN (BARU) ---
    // Pastikan PIN di Sheet (teacherData.PIN) diubah ke string dulu biar aman
    const correctPin = teacherData.PIN ? teacherData.PIN.toString() : "";

    if (inputPin !== correctPin) {
        // Jika PIN Salah
        Swal.fire({ 
            icon: 'error', 
            title: 'Akses Ditolak', 
            text: 'PIN yang Anda masukkan salah!',
            confirmButtonColor: '#D4AF37'
        });
        return; 
    }
    // -----------------------------

    // Jika Benar, Lanjut Login...
    currentTeacher = selectedName;
    if (teacherData && teacherData.Mapel_Ajar) {
        currentTeacherMapel = teacherData.Mapel_Ajar.toString().split(',').map(item => item.trim());
    } else { currentTeacherMapel = []; }

    updateUserProfile(currentTeacher);
    
    // Animasi Sukses Login
    Swal.fire({
        icon: 'success',
        title: 'Ahlan wa Sahlan',
        text: `Selamat datang, ${selectedName}`,
        timer: 1500,
        showConfirmButton: false
    });

    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    showPage('dashboard');
}
function updateUserProfile(name) {
    document.getElementById('header-nama-guru').innerText = name;
    const initials = name.match(/\b\w/g) || [];
    document.getElementById('header-avatar').innerText = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
    document.getElementById('welcome-nama-guru').innerText = name;
    document.getElementById('input-guru-hidden').value = name;
    document.getElementById('display-guru-form').innerText = name;
}

function handleLogout() {
    Swal.fire({
        title: translations[currentLang].confirm_logout,
        text: "Anda harus memasukkan PIN lagi nanti.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#D4AF37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            location.reload();
        }
    })
}

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    // Tutup sidebar otomatis kalau di HP
    if(window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebar-overlay').classList.remove('active');
    }

    document.getElementById('page-title').innerText = pageId.toUpperCase();

    if(pageId === 'rpp') fetchData('getRPP');
    if(pageId === 'silabus') fetchData('getSilabus');
    if(pageId === 'rapor') loadRapor();
    if(pageId === 'penilaian') updateMapelDropdown();
}

function updateMapelDropdown() {
    const selectMapel = document.getElementById('input-mapel');
    selectMapel.innerHTML = ''; 
    if (currentTeacherMapel.length === 0) {
        selectMapel.innerHTML = '<option value="">-</option>';
        return;
    }
    currentTeacherMapel.forEach(mapel => {
        const option = document.createElement('option');
        option.value = mapel;
        option.innerText = mapel;
        selectMapel.appendChild(option);
    });
}

async function fetchData(action, isInitialLoad = false) {
    const loader = document.getElementById('loader');
    if(!isInitialLoad && loader) loader.classList.remove('hidden');

    try {
        const response = await fetch(`${API_URL}?action=${action}`);
        const data = await response.json();
        if(!isInitialLoad && loader) loader.classList.add('hidden');

        if (action === 'getGuru') { rawDataGuru = data; populateLoginDropdown(data); }
        if (action === 'getSiswa') { populateSiswaDropdown(data); }
        if (action === 'getRPP') { rawDataRPP = data; setupFilter('filter-rpp', data, 'Mata_Pelajaran'); renderRPP(data); }
        if (action === 'getSilabus') { rawDataSilabus = data; setupFilter('filter-silabus', data, 'Mata_Pelajaran'); renderSilabus(data); }
        if (action === 'getNilai') renderRapor(data);
    } catch (error) { console.error("Error:", error); }
}

function populateLoginDropdown(data) {
    const select = document.getElementById('login-guru-select');
    select.innerHTML = '<option value="">-- Pilih --</option>';
    data.forEach(item => { if(item.Nama_Guru) {
        const option = document.createElement('option');
        option.value = item.Nama_Guru;
        option.innerText = item.Nama_Guru;
        select.appendChild(option);
    }});
}

function populateSiswaDropdown(data) {
    const select = document.getElementById('input-nama');
    select.innerHTML = '<option value="">-- Pilih --</option>';
    data.sort((a, b) => (a.Nama || "").localeCompare(b.Nama || ""));
    data.forEach(item => { if(item.Nama) {
        const option = document.createElement('option');
        option.value = item.Nama;
        option.innerText = `${item.Nama} (${item.Kelas || '-'})`;
        select.appendChild(option);
    }});
}

function setupFilter(id, data, key) {
    const select = document.getElementById(id);
    const unique = [...new Set(data.map(i => i[key]))];
    select.innerHTML = '<option value="all">ALL</option>';
    unique.forEach(val => { if(val) select.innerHTML += `<option value="${val}">${val}</option>`; });
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
    if(data.length === 0) { tbody.innerHTML = '<tr><td colspan="5">Empty</td></tr>'; return; }
    data.forEach(item => {
        tbody.innerHTML += `<tr><td style="font-weight:bold; color:#2F5D62">${item.Mata_Pelajaran||'-'}</td><td>${item.Pertemuan_Ke||'-'}</td><td>${item.Materi||'-'}</td><td>${item.Tujuan||'-'}</td><td>${item.Kegiatan||'-'}</td></tr>`;
    });
}

function renderSilabus(data) {
    const container = document.getElementById('silabus-container');
    container.innerHTML = '';
    if(data.length === 0) { container.innerHTML = '<p>Empty</p>'; return; }
    data.forEach(item => {
        container.innerHTML += `<div style="padding:15px; border-left:4px solid #D4AF37; background:#fff; margin-bottom:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><div style="display:flex; justify-content:space-between;"><b style="color:#2F5D62">${item.Mata_Pelajaran}</b><span style="color:#888; font-size:0.8rem">Week ${item.Pekan}</span></div><h4 style="margin:5px 0;">${item.Tema}</h4><p style="color:#555; font-size:0.9rem">🎯 ${item.Target_Hafalan}</p></div>`;
    });
}

function loadRapor() { fetchData('getNilai'); }
function renderRapor(data) {
    const tbody = document.querySelector('#table-rapor tbody');
    tbody.innerHTML = '';
    data.slice().reverse().forEach(item => {
        const textWA = `Assalamu'alaikum, info nilai ${item.Nama_Siswa} (${item.Mata_Pelajaran}): ${item.Nilai}. Ket: ${item.Keterangan}`;
        const linkWA = `https://wa.me/?text=${encodeURIComponent(textWA)}`;
        tbody.innerHTML += `<tr><td>${item.Nama_Siswa}</td><td>${item.Mata_Pelajaran}</td><td style="font-weight:bold;">${item.Nilai}</td><td>${item.Keterangan}</td><td style="text-align:center;"><a href="${linkWA}" target="_blank" style="text-decoration:none; background:#25D366; color:white; padding:5px 10px; border-radius:5px; font-size:0.8rem;">📲 WA</a></td></tr>`;
    });
}

document.getElementById('form-nilai').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.querySelector('.btn-gold');
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    const data = {
        nama: document.getElementById('input-nama').value,
        mapel: document.getElementById('input-mapel').value,
        nilai: document.getElementById('input-nilai').value,
        ket: document.getElementById('input-ket').value,
        guru: document.getElementById('input-guru-hidden').value
    };

    fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) })
   // GANTI BAGIAN INI DI script.js (Bagian Fetch Success)

.then(() => {
    // Ganti alert biasa dengan ini:
    Swal.fire({
        title: 'Alhamdulillah!',
        text: translations[currentLang].alert_save_success,
        icon: 'success',
        confirmButtonText: 'Lanjut',
        confirmButtonColor: '#D4AF37', // Warna Emas kita!
        background: '#FDFBF7' // Warna Krem background kita
    });

    document.getElementById('form-nilai').reset();
    document.getElementById('input-guru-hidden').value = currentTeacher;
    changeLanguage(currentLang); 
    btn.innerText = originalText;
    btn.disabled = false;
})
    .catch(err => {
        alert("Error saving data.");
        btn.innerText = originalText;
        btn.disabled = false;
    });
});
