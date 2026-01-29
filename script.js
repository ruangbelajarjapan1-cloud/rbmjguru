/* =========================================
   LOGIC SISTEM AKADEMIK RBM JAPAN - FULL
   ========================================= */

// PENTING: Ganti URL di bawah dengan URL Web App Apps Script Anda!
const API_URL = 'https://script.google.com/macros/s/AKfycbxetySGgJvC_cEA2ybFqy1HeZ_ut_Pj2SZLekpFiOihxzMCuFJBOvU1N54WiDEkD4bb/exec';

// -- KAMUS BAHASA (TRANSLATION) --
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
        login_desc: "Select teacher profile",
        loading: "Loading...",
        btn_enter: "Login",
        menu_dashboard: "🏠 Dashboard",
        menu_rpp: "📚 Lesson Plan",
        menu_silabus: "📜 Syllabus",
        menu_nilai: "✍️ Input Grade",
        menu_rapor: "📊 Report Card",
        btn_logout: "Logout",
        greeting: "Peace be upon you",
        col_mapel: "Subject",
        col_meet: "Meeting",
        col_materi: "Topic",
        col_tujuan: "Goal",
        col_kegiatan: "Activity",
        title_input: "Input Grade",
        label_siswa: "Student",
        label_mapel: "Subject",
        label_nilai: "Score",
        label_ket: "Notes",
        btn_save: "Save",
        info_guru: "By:",
        alert_select_guru: "Select a teacher.",
        alert_save_success: "Data saved!",
        confirm_logout: "Logout?"
    },
    jp: {
        login_welcome: "ようこそ",
        login_desc: "講師を選択",
        loading: "読み込み中...",
        btn_enter: "ログイン",
        menu_dashboard: "🏠 ダッシュボード",
        menu_rpp: "📚 指導案",
        menu_silabus: "📜 シラバス",
        menu_nilai: "✍️ 成績入力",
        menu_rapor: "📊 成績表",
        btn_logout: "ログアウト",
        greeting: "アッサラーム",
        col_mapel: "科目",
        col_meet: "回",
        col_materi: "トピック",
        col_tujuan: "目標",
        col_kegiatan: "活動",
        title_input: "成績入力",
        label_siswa: "生徒名",
        label_mapel: "科目",
        label_nilai: "点数",
        label_ket: "備考",
        btn_save: "保存",
        info_guru: "入力者:",
        alert_select_guru: "講師を選択してください。",
        alert_save_success: "保存しました！",
        confirm_logout: "ログアウト？"
    }
};

// -- VARIABLE GLOBAL (TEMPAT PENYIMPANAN DATA SEMENTARA) --
let currentLang = 'id'; 
let currentTeacher = null;
let currentTeacherMapel = [];
let rawDataGuru = [];
let rawDataSiswa = [];
let rawDataRPP = [];
let rawDataSilabus = [];

// -- 1. INIT: JALAN SAAT WEBSITE DIBUKA --
document.addEventListener('DOMContentLoaded', () => {
    // Ambil data Guru untuk Login
    fetchData('getGuru', true);
    // Ambil data Siswa untuk Input Nilai
    fetchData('getSiswa', true);
    // Set bahasa default
    document.getElementById('lang-select-login').value = currentLang;
});

// -- 2. FUNGSI PENGGANTIAN BAHASA --
function changeLanguage(lang) {
    currentLang = lang;
    // Ubah dropdown di login dan sidebar agar sinkron
    document.getElementById('lang-select-login').value = lang;
    document.getElementById('lang-select-sidebar').value = lang;
    
    // Cari semua elemen yang punya atribut 'data-lang'
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

// -- 3. LOGIKA LOGIN & CEK PIN --
function handleLogin() {
    const select = document.getElementById('login-guru-select');
    const inputPin = document.getElementById('login-pin').value;
    const selectedName = select.value;

    // Cek 1: Apakah nama sudah dipilih?
    if (!selectedName) {
        Swal.fire({ icon: 'warning', title: 'Oops...', text: translations[currentLang].alert_select_guru, confirmButtonColor: '#D4AF37' });
        return;
    }

    // Cari data guru dari database lokal
    const teacherData = rawDataGuru.find(g => g.Nama_Guru === selectedName);
    
    // Cek 2: Verifikasi PIN
    // Ubah PIN ke string agar aman (cegah error jika PIN dianggap angka)
    const correctPin = teacherData && teacherData.PIN ? teacherData.PIN.toString() : "";
    
    // Jika ada PIN di database, tapi input salah
    if (correctPin !== "" && inputPin !== correctPin) {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'PIN Salah!', confirmButtonColor: '#D4AF37' });
        return; 
    }

    // LOGIN SUKSES
    currentTeacher = selectedName;
    
    // Simpan Mapel guru ini ke variable
    if (teacherData && teacherData.Mapel_Ajar) {
        currentTeacherMapel = teacherData.Mapel_Ajar.toString().split(',').map(item => item.trim());
    } else { 
        currentTeacherMapel = []; 
    }

    // Update Tampilan Profil
    document.getElementById('header-nama-guru').innerText = selectedName;
    document.getElementById('welcome-nama-guru').innerText = selectedName;
    document.getElementById('input-guru-hidden').value = selectedName;
    document.getElementById('display-guru-form').innerText = selectedName;
    
    // Buat inisial nama (Misal: Ustadzah Yuni -> UY)
    const initials = selectedName.match(/\b\w/g) || [];
    document.getElementById('header-avatar').innerText = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();

    // Tampilkan Notifikasi Sukses
    Swal.fire({ icon: 'success', title: 'Berhasil Masuk', timer: 1000, showConfirmButton: false });
    
    // Pindah Halaman
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    showPage('dashboard');
}

function handleLogout() {
    Swal.fire({ 
        title: translations[currentLang].confirm_logout, 
        icon: 'question', 
        showCancelButton: true, 
        confirmButtonColor: '#D4AF37' 
    }).then((result) => {
        if (result.isConfirmed) {
            location.reload(); // Refresh halaman
        }
    })
}

// -- 4. NAVIGASI HALAMAN --
function showPage(pageId) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    
    // Tampilkan halaman yang dipilih
    document.getElementById(pageId).classList.remove('hidden');
    
    // Tutup sidebar otomatis jika di HP
    if(window.innerWidth <= 768) { 
        document.getElementById('sidebar').classList.remove('active'); 
        document.getElementById('sidebar-overlay').classList.remove('active'); 
    }
    
    document.getElementById('page-title').innerText = pageId.toUpperCase();

    // Logic Khusus per Halaman
    if(pageId === 'dashboard') loadSmartDashboard();
    if(pageId === 'rpp') fetchData('getRPP');
    if(pageId === 'silabus') fetchData('getSilabus');
    if(pageId === 'rapor') loadRapor();
    if(pageId === 'penilaian') updateMapelDropdown();
}

// -- 5. SMART DASHBOARD WIDGETS --
function loadSmartDashboard() {
    // A. Tampilkan Tanggal Hijriyah
    const date = new Date();
    const hijri = new Intl.DateTimeFormat('id-TN-u-ca-islamic', {day:'numeric', month:'long', year:'numeric'}).format(date);
    const masehi = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(date);
    document.getElementById('hijri-date').innerText = `${masehi} | ${hijri}`;

    // B. Logika Pengingat Sunnah
    const day = date.getDay(); 
    const hour = date.getHours();
    let msg = "Perbanyak dzikir dan istighfar."; 
    let icon = "📖";

    if (day === 1 || day === 4) { // Senin / Kamis
        icon = "🥤"; 
        msg = "Sunnah Puasa Senin-Kamis."; 
    } else if (day === 5) { // Jumat
        icon = "🕌"; 
        msg = "Jumat Berkah. Baca Al-Kahfi & Shalawat."; 
    } else {
        if (hour >= 6 && hour < 11) { 
            icon = "☀️"; msg = "Sudah Sholat Dhuha hari ini?"; 
        } else if (hour >= 15 && hour < 18) { 
            icon = "📿"; msg = "Waktu mustajab. Dzikir Petang."; 
        }
    }
    document.getElementById('sunnah-msg').innerHTML = msg;
    document.getElementById('sunnah-icon').innerHTML = icon;

    // C. Tampilkan Statistik
    document.getElementById('stat-siswa').innerText = rawDataSiswa.length || "0";
    document.getElementById('stat-guru').innerText = rawDataGuru.length || "0";

    // D. Load To-Do List
    loadTodos();
}

// -- 6. FITUR TO-DO LIST (SIMPAN DI HP) --
function loadTodos() {
    const list = document.getElementById('todo-list');
    const todos = JSON.parse(localStorage.getItem('rbm_todos')) || [];
    list.innerHTML = '';
    
    if (todos.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:#ccc;">Belum ada catatan</li>';
    }

    todos.forEach((todo, index) => {
        list.innerHTML += `
            <li class="${todo.done ? 'completed' : ''}">
                <span onclick="toggleTodo(${index})">${todo.text}</span> 
                <button onclick="deleteTodo(${index})" class="btn-del">✕</button>
            </li>`;
    });
}

function addTodo() {
    const input = document.getElementById('todo-input');
    if(!input.value.trim()) return;
    
    const todos = JSON.parse(localStorage.getItem('rbm_todos')) || [];
    todos.push({ text: input.value, done: false });
    localStorage.setItem('rbm_todos', JSON.stringify(todos));
    
    input.value = ''; 
    loadTodos();
}

function deleteTodo(i) { 
    const t = JSON.parse(localStorage.getItem('rbm_todos')); 
    t.splice(i,1); 
    localStorage.setItem('rbm_todos',JSON.stringify(t)); 
    loadTodos(); 
}

function toggleTodo(i) { 
    const t = JSON.parse(localStorage.getItem('rbm_todos')); 
    t[i].done = !t[i].done; 
    localStorage.setItem('rbm_todos',JSON.stringify(t)); 
    loadTodos(); 
}

function handleTodoKey(e) { 
    if(e.key === 'Enter') addTodo(); 
}

// -- 7. PENGAMBILAN DATA DARI SPREADSHEET (FETCH) --

// Update Dropdown Mapel di Halaman Penilaian
function updateMapelDropdown() {
    const select = document.getElementById('input-mapel'); 
    select.innerHTML = ''; 
    
    if (currentTeacherMapel.length === 0) { 
        select.innerHTML = '<option value="">- Mapel Kosong -</option>'; 
        return; 
    }
    
    currentTeacherMapel.forEach(m => { 
        const opt = document.createElement('option'); 
        opt.value = m; 
        opt.innerText = m; 
        select.appendChild(opt); 
    });
}

// Fungsi Utama Mengambil Data
async function fetchData(action, isInitial) {
    const loader = document.getElementById('loader');
    if(!isInitial && loader) loader.classList.remove('hidden');
    
    try {
        const res = await fetch(`${API_URL}?action=${action}`);
        const data = await res.json();
        
        if(!isInitial && loader) loader.classList.add('hidden');

        // Routing data sesuai aksi
        if (action === 'getGuru') { 
            rawDataGuru = data; 
            populateLoginDropdown(data); 
        }
        if (action === 'getSiswa') { 
            rawDataSiswa = data; 
            populateSiswaDropdown(data); 
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
        if (action === 'getNilai') {
            renderRapor(data);
        }
    } catch (e) { 
        console.error(e); 
        if(loader) loader.innerText = "Error Koneksi";
    }
}

// Mengisi Dropdown Guru di Login
function populateLoginDropdown(data) {
    const s = document.getElementById('login-guru-select'); 
    s.innerHTML = '<option value="">-- Pilih Nama --</option>';
    data.forEach(i => { 
        if(i.Nama_Guru) { 
            const o = document.createElement('option'); 
            o.value=i.Nama_Guru; 
            o.innerText=i.Nama_Guru; 
            s.appendChild(o); 
        }
    });
}

// Mengisi Dropdown Siswa (dengan nama & kelas)
function populateSiswaDropdown(data) {
    const s = document.getElementById('input-nama'); 
    s.innerHTML = '<option value="">-- Pilih Siswa --</option>';
    
    // Urutkan nama A-Z
    data.sort((a,b)=>(a.Nama||"").localeCompare(b.Nama||""));
    
    data.forEach(i => { 
        if(i.Nama) { 
            const o = document.createElement('option'); 
            o.value = i.Nama; 
            o.innerText = `${i.Nama} (${i.Kelas||'-'})`; 
            s.appendChild(o); 
        }
    });
}

// -- 8. RENDER TABEL & FILTER --

function setupFilter(id, data, key) {
    const s = document.getElementById(id); 
    const u = [...new Set(data.map(i => i[key]))]; // Ambil data unik
    s.innerHTML = '<option value="all">SEMUA MAPEL</option>';
    u.forEach(v => { 
        if(v) s.innerHTML += `<option value="${v}">${v}</option>`; 
    });
}

function filterData(type) {
    const v = document.getElementById(`filter-${type}`).value;
    
    if(type === 'rpp') {
        const filtered = v === 'all' ? rawDataRPP : rawDataRPP.filter(i => i.Mata_Pelajaran === v);
        renderRPP(filtered);
    }
    if(type === 'silabus') {
        const filtered = v === 'all' ? rawDataSilabus : rawDataSilabus.filter(i => i.Mata_Pelajaran === v);
        renderSilabus(filtered);
    }
}

function renderRPP(data) {
    const b = document.querySelector('#table-rpp tbody'); 
    b.innerHTML = '';
    if(!data.length) { b.innerHTML='<tr><td colspan="5" style="text-align:center">Data Kosong</td></tr>'; return;}
    
    data.forEach(i => {
        b.innerHTML += `<tr>
            <td style="font-weight:bold; color:#2F5D62">${i.Mata_Pelajaran||'-'}</td>
            <td>${i.Pertemuan_Ke||'-'}</td>
            <td>${i.Materi||'-'}</td>
            <td>${i.Tujuan||'-'}</td>
            <td>${i.Kegiatan||'-'}</td>
        </tr>`;
    });
}

function renderSilabus(data) {
    const c = document.getElementById('silabus-container'); 
    c.innerHTML = '';
    if(!data.length) { c.innerHTML='<p style="text-align:center">Data Kosong</p>'; return;}
    
    data.forEach(i => {
        c.innerHTML += `
        <div style="padding:15px; border-left:4px solid #D4AF37; background:#fff; margin-bottom:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05); border-radius:8px;">
            <div style="display:flex; justify-content:space-between;">
                <b style="color:#2F5D62">${i.Mata_Pelajaran}</b>
                <span style="color:#888; font-size:0.8rem">Pekan ${i.Pekan}</span>
            </div>
            <h4 style="margin:5px 0;">${i.Tema}</h4>
            <p style="color:#555; font-size:0.9rem">🎯 ${i.Target_Hafalan}</p>
        </div>`;
    });
}

function loadRapor() { fetchData('getNilai'); }

function renderRapor(data) {
    const b = document.querySelector('#table-rapor tbody'); 
    b.innerHTML = '';
    
    // Tampilkan data terbaru paling atas (reverse)
    data.slice().reverse().forEach(i => {
        // Format Pesan WhatsApp
        const txt = `Assalamu'alaikum, nilai ananda ${i.Nama_Siswa} untuk mapel (${i.Mata_Pelajaran}): ${i.Nilai}. Keterangan: ${i.Keterangan}`;
        const wa = `https://wa.me/?text=${encodeURIComponent(txt)}`;
        
        b.innerHTML += `<tr>
            <td>${i.Nama_Siswa}</td>
            <td>${i.Mata_Pelajaran}</td>
            <td style="font-weight:bold;">${i.Nilai}</td>
            <td>${i.Keterangan}</td>
            <td style="text-align:center;">
                <a href="${wa}" target="_blank" style="text-decoration:none; background:#25D366; color:white; padding:5px 10px; border-radius:5px; font-size:0.8rem;">📲 WA</a>
            </td>
        </tr>`;
    });
}

// -- 9. SUBMIT NILAI (KIRIM KE SPREADSHEET) --
document.getElementById('form-nilai').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.querySelector('.btn-gold'); 
    const originalText = btn.innerText;
    
    btn.innerText = "Menyimpan..."; 
    btn.disabled = true;

    const d = {
        nama: document.getElementById('input-nama').value,
        mapel: document.getElementById('input-mapel').value,
        nilai: document.getElementById('input-nilai').value,
        ket: document.getElementById('input-ket').value,
        guru: document.getElementById('input-guru-hidden').value
    };

    fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(d) })
    .then(() => {
        Swal.fire({ title: 'Sukses!', text: translations[currentLang].alert_save_success, icon: 'success', confirmButtonColor: '#D4AF37' });
        
        document.getElementById('form-nilai').reset();
        
        // Kembalikan nama guru ke hidden input
        document.getElementById('input-guru-hidden').value = currentTeacher;
        
        btn.innerText = originalText; 
        btn.disabled = false;
    })
    .catch(() => { 
        Swal.fire({ icon:'error', title:'Gagal', text:'Cek koneksi internet Anda' }); 
        btn.innerText=originalText; 
        btn.disabled=false; 
    });
});
