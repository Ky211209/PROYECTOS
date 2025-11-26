import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, onSnapshot, where, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAMQpnPJSdicgo5gungVOE0M7OHwkz4P9Y",
    authDomain: "autenticacion-8faac.firebaseapp.com",
    projectId: "autenticacion-8faac",
    storageBucket: "autenticacion-8faac.firebasestorage.app",
    messagingSenderId: "939518706600",
    appId: "1:939518706600:web:d28c3ec7de21da8379939d",
    measurementId: "G-8LXM9VS1M0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- AUTORIZACIÓN ---
const correosDosDispositivos = ["dpachecog2@unemi.edu.ec", "htigrer@unemi.edu.ec", "sgavilanezp2@unemi.edu.ec", "jzamoram9@unemi.edu.ec", "fcarrillop@unemi.edu.ec", "naguilarb@unemi.edu.ec", "kholguinb2@unemi.edu.ec"];
const correosUnDispositivo = ["cnavarretem4@unemi.edu.ec", "gorellanas2@unemi.edu.ec", "ehidalgoc4@unemi.edu.ec", "lbrionesg3@unemi.edu.ec", "xsalvadorv@unemi.edu.ec", "nbravop4@unemi.edu.ec", "jmoreirap6@unemi.edu.ec", "jcastrof8@unemi.edu.ec", "jcaleroc3@unemi.edu.ec"];
const correosPermitidos = [...correosDosDispositivos, ...correosUnDispositivo];

// --- GENERADOR DE AVATARES (ROBOTS/MONSTRUOS) ---
// Usamos DiceBear API para generar imágenes únicas basadas en semillas
const AVATAR_SEEDS = ['Felix', 'Aneka', 'Zoe', 'Bear', 'Chester', 'Bandit', 'Molly', 'Buster', 'Lucky', 'Ginger'];
let currentAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=Felix`; // Default
let currentStreak = 0;

// --- BANCO DE PREGUNTAS (64 PREGUNTAS) ---
const bancoPreguntas = [
    { texto: "¿Cuál es un ejemplo de amenaza técnica según el documento?", opciones: ["Phishing", "Baja tensión eléctrica", "Inyección SQL", "Insider"], respuesta: 1, explicacion: "Respuesta correcta: Baja tensión eléctrica." },
    { texto: "¿Qué herramienta open-source permite escaneos de gran escala en red y sistemas?", opciones: ["Nmap", "Fortinet WVS", "OpenVAS", "Nessus Essentials"], respuesta: 2, explicacion: "Respuesta correcta: OpenVAS." },
    { texto: "Una amenaza ambiental típica para un centro de datos sería:", opciones: ["Huracán", "Robo de servidores", "Virus informático", "Pérdida de energía"], respuesta: 0, explicacion: "Respuesta correcta: Huracán." },
    // ... PEGA AQUÍ EL RESTO DE LAS 64 PREGUNTAS (ESTÁN EN LAS RESPUESTAS ANTERIORES) ...
    { texto: "Herramienta que identifica puertos abiertos y sistema operativo desde consola:", opciones: ["OpenVAS", "Wireshark", "Nessus", "Nmap"], respuesta: 3, explicacion: "Respuesta correcta: Nmap." },
    { texto: "Un IDS normalmente responde:", opciones: ["Eliminando archivos", "Aumentando ancho de banda", "Generando alertas o registrando eventos", "Cambiando contraseñas"], respuesta: 2, explicacion: "Respuesta correcta: Generando alertas o registrando eventos." },
    { texto: "Un objetivo clave de la seguridad de bases de datos es mantener la:", opciones: ["Confidencialidad, integridad y disponibilidad (CIA)", "Fragmentación", "Redundancia excesiva", "Compresión"], respuesta: 0, explicacion: "Respuesta correcta: Confidencialidad, integridad y disponibilidad (CIA)." }
];

// VARIABLES GLOBALES
let preguntasExamen = [];
let indiceActual = 0;
let respuestasUsuario = [];
let seleccionTemporal = null;
let tiempoRestante = 0;
let intervaloTiempo;
let currentUserEmail = "";
let currentRoomId = null;
let currentMode = 'individual';
let unsubscribeRoom = null;

// --- INICIALIZACIÓN DE AVATARES (IMÁGENES) ---
function initAvatars() {
    const grid = document.getElementById('avatar-grid');
    grid.innerHTML = '';
    
    AVATAR_SEEDS.forEach((seed, index) => {
        // Usamos estilo 'bottts' para robots de seguridad
        const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
        const img = document.createElement('img');
        img.src = url;
        img.className = 'avatar-option';
        
        if(index === 0) {
            img.classList.add('avatar-selected');
            currentAvatarUrl = url;
        }

        img.onclick = () => {
            document.querySelectorAll('.avatar-option').forEach(x => x.classList.remove('avatar-selected'));
            img.classList.add('avatar-selected');
            currentAvatarUrl = url;
        };
        grid.appendChild(img);
    });
}

// --- PROTECCIÓN ---
window.addEventListener('beforeunload', (e) => {
    if (!document.getElementById('quiz-screen').classList.contains('hidden') || 
        !document.getElementById('lobby-screen').classList.contains('hidden')) {
        e.preventDefault(); e.returnValue = '';
    }
});

function showScreen(screenId) {
    document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

// --- AUTH & DEVICE ---
function obtenerDeviceId() {
    let deviceId = localStorage.getItem('device_id_seguro');
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
        localStorage.setItem('device_id_seguro', deviceId);
    }
    return deviceId;
}

async function validarDispositivo(user) {
    const email = user.email;
    currentUserEmail = email;
    const miDeviceId = obtenerDeviceId();
    let limite = correosDosDispositivos.includes(email) ? 2 : 1;
    const docRef = doc(db, "usuarios_seguros", email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const datos = docSnap.data();
        let lista = datos.dispositivos || [];
        if (lista.includes(miDeviceId)) return true;
        if (lista.length < limite) {
            lista.push(miDeviceId);
            await setDoc(docRef, { dispositivos: lista }, { merge: true });
            return true;
        } else {
            alert(`⛔ ACCESO DENEGADO\nLímite de ${limite} dispositivos alcanzado.`);
            await signOut(auth);
            location.reload();
            return false;
        }
    } else {
        await setDoc(docRef, { dispositivos: [miDeviceId], fecha: new Date().toISOString() });
        return true;
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (correosPermitidos.includes(user.email)) {
            if (await validarDispositivo(user)) {
                showScreen('setup-screen');
                document.getElementById('btn-logout').classList.remove('hidden');
                document.getElementById('user-display').innerText = user.email.split('@')[0];
                document.getElementById('player-nickname').value = user.email.split('@')[0];
                initAvatars(); // Cargar avatares
            }
        } else {
            alert("No autorizado.");
            signOut(auth);
        }
    } else {
        showScreen('auth-screen');
        document.getElementById('btn-logout').classList.add('hidden');
    }
});

document.getElementById('btn-google').addEventListener('click', () => signInWithPopup(auth, new GoogleAuthProvider()));
document.getElementById('btn-logout').addEventListener('click', () => { if(confirm("¿Salir?")) { signOut(auth); location.reload(); } });

// --- MENU ---
document.getElementById('btn-mode-individual').addEventListener('click', () => iniciarExamenIndividual());
document.getElementById('btn-mode-multiplayer').addEventListener('click', mostrarSelectorSalas);
document.getElementById('btn-stats').addEventListener('click', () => { cargarGrafico(); document.getElementById('stats-modal').classList.remove('hidden'); });

// --- MULTIPLAYER ---
const SALAS_PREDEFINIDAS = ["SALA_ALPHA", "SALA_BETA", "SALA_GAMMA", "SALA_DELTA"];

function mostrarSelectorSalas() {
    showScreen('rooms-screen');
    const list = document.getElementById('rooms-list');
    list.innerHTML = '';
    SALAS_PREDEFINIDAS.forEach(salaId => {
        const btn = document.createElement('div');
        btn.className = 'room-btn';
        btn.innerHTML = `<strong>${salaId.replace('_', ' ')}</strong><span class="room-count" id="count-${salaId}">...</span>`;
        onSnapshot(doc(db, "salas_activas", salaId), (docSnap) => {
            const count = docSnap.exists() ? (docSnap.data().jugadores || []).length : 0;
            const el = document.getElementById(`count-${salaId}`);
            if(el) el.innerText = `${count} Agentes`;
        });
        btn.onclick = () => unirseASala(salaId);
        list.appendChild(btn);
    });
}

async function unirseASala(salaId) {
    currentRoomId = salaId;
    currentMode = 'multiplayer';
    const salaRef = doc(db, "salas_activas", salaId);
    const nick = document.getElementById('player-nickname').value || currentUserEmail.split('@')[0];

    // Guardamos el objeto jugador con su avatar
    const jugadorData = { name: nick, avatar: currentAvatarUrl };

    await setDoc(salaRef, { jugadores: arrayUnion(jugadorData), estado: "esperando" }, { merge: true });

    showScreen('lobby-screen');
    document.getElementById('lobby-title').innerText = salaId.replace('_', ' ');

    unsubscribeRoom = onSnapshot(salaRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const jugadores = data.jugadores || [];
            const listDiv = document.getElementById('lobby-players');
            listDiv.innerHTML = '';
            
            // Renderizar lista con imagen
            jugadores.forEach(p => { 
                // Soporte retroactivo para strings simples
                const name = p.name || p; 
                const av = p.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=default';
                listDiv.innerHTML += `
                <div class="player-badge">
                    <img src="${av}" class="lobby-avatar-small"> ${name}
                </div>`; 
            });
            
            document.getElementById('lobby-status-text').innerText = `Agentes: ${jugadores.length} (Mínimo 2)`;
            
            const btnStart = document.getElementById('btn-start-war');
            if (jugadores.length >= 2) btnStart.classList.remove('hidden');
            else btnStart.classList.add('hidden');

            if (data.estado === 'jugando') iniciarQuizMultiplayer();
        }
    });
}

document.getElementById('btn-leave-lobby').addEventListener('click', async () => {
    if (confirm("¿Abandonar escuadrón?")) {
        if (currentRoomId) {
            const salaRef = doc(db, "salas_activas", currentRoomId);
            const nick = document.getElementById('player-nickname').value || currentUserEmail.split('@')[0];
            // Nota: arrayRemove requiere el objeto exacto, lo simplificamos removiendo por lógica en app real
            // Por ahora recargamos para limpiar estado simple
            location.reload(); 
        }
    }
});

document.getElementById('btn-start-war').addEventListener('click', async () => {
    const salaRef = doc(db, "salas_activas", currentRoomId);
    await updateDoc(salaRef, { estado: 'jugando' });
});

document.getElementById('back-to-menu').addEventListener('click', () => showScreen('setup-screen'));

// --- QUIZ ENGINE ---
function iniciarExamenIndividual() {
    currentMode = 'individual';
    preguntasExamen = [...bancoPreguntas].sort(() => 0.5 - Math.random()).slice(0, 20);
    iniciarInterfazQuiz();
}

function iniciarQuizMultiplayer() {
    if (unsubscribeRoom) unsubscribeRoom();
    preguntasExamen = [...bancoPreguntas].sort(() => 0.5 - Math.random()).slice(0, 20); 
    iniciarInterfazQuiz();
}

function iniciarInterfazQuiz() {
    respuestasUsuario = [];
    indiceActual = 0;
    currentStreak = 0;
    
    const bgMusic = document.getElementById('bg-music');
    const vol = document.getElementById('volume-slider').value;
    if(bgMusic) { bgMusic.volume = vol; bgMusic.play().catch(e => console.log("Autoplay fail")); }

    showScreen('quiz-screen');
    cargarPregunta();
}

function cargarPregunta() {
    if (indiceActual >= preguntasExamen.length) { terminarQuiz(); return; }
    
    const data = preguntasExamen[indiceActual];
    document.getElementById('question-text').innerText = `${indiceActual + 1}. ${data.texto}`;
    const cont = document.getElementById('options-container'); cont.innerHTML = '';
    seleccionTemporal = null;
    document.getElementById('btn-next-question').classList.add('hidden');

    data.opciones.forEach((opcion, index) => {
        const btn = document.createElement('button');
        btn.innerText = opcion;
        btn.onclick = () => seleccionarOpcion(index, btn);
        cont.appendChild(btn);
    });
    document.getElementById('progress-display').innerText = `Pregunta ${indiceActual + 1}/${preguntasExamen.length}`;
}

function seleccionarOpcion(index, btn) {
    seleccionTemporal = index;
    const btns = document.getElementById('options-container').querySelectorAll('button');
    btns.forEach(b => b.classList.remove('option-selected'));
    btn.classList.add('option-selected');
    document.getElementById('btn-next-question').classList.remove('hidden');
}

document.getElementById('btn-next-question').addEventListener('click', () => {
    if (seleccionTemporal !== null) {
        // LOGICA DE RACHA (PREMIOS)
        const correcta = preguntasExamen[indiceActual].respuesta;
        if (seleccionTemporal === correcta) {
            currentStreak++;
            if(currentStreak >= 2) mostrarRacha(currentStreak);
        } else {
            currentStreak = 0;
        }

        respuestasUsuario.push(seleccionTemporal);
        indiceActual++;
        cargarPregunta();
    }
});

function mostrarRacha(n) {
    const d = document.getElementById('combo-display');
    d.innerText = `¡RACHA x${n}! 🔥`;
    d.classList.remove('hidden');
    // Sonido de racha
    const sfx = document.getElementById('correct-sound');
    const vol = document.getElementById('volume-slider').value;
    sfx.volume = vol; sfx.play();
    setTimeout(() => d.classList.add('hidden'), 1500);
}

document.getElementById('btn-quit-quiz').addEventListener('click', () => {
    if(confirm("¿Rendirse? Se guardará tu nota actual.")) terminarQuiz(true);
});

async function terminarQuiz(abandono = false) {
    const bgMusic = document.getElementById('bg-music');
    if(bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }

    let aciertos = 0;
    respuestasUsuario.forEach((r, i) => {
        if (i < preguntasExamen.length && r === preguntasExamen[i].respuesta) aciertos++;
    });
    const nota = Math.round((aciertos / preguntasExamen.length) * 100);
    const nick = document.getElementById('player-nickname').value || currentUserEmail.split('@')[0];

    if (currentMode === 'multiplayer' && currentRoomId) {
        await addDoc(collection(db, `salas_activas/${currentRoomId}/resultados`), {
            user: nick,
            avatar: currentAvatarUrl, // Guardamos la URL del avatar
            score: nota,
            correctas: aciertos,
            status: abandono ? "Retirado" : "Finalizado",
            date: new Date()
        });
        escucharResultadosSala();
        document.getElementById('room-results-box').classList.remove('hidden');
    } else {
        document.getElementById('room-results-box').classList.add('hidden');
        guardarHistorialLocal(nota);
    }

    showScreen('result-screen');
    document.getElementById('score-final').innerText = `${nota}/100`;
    document.getElementById('final-avatar-display').src = currentAvatarUrl;
    
    const msg = document.getElementById('custom-msg');
    const sfxWin = document.getElementById('success-sound');
    const sfxFail = document.getElementById('fail-sound');
    const vol = document.getElementById('volume-slider').value;
    sfxWin.volume = vol; sfxFail.volume = vol;

    if (nota >= 70) sfxWin.play(); else sfxFail.play();

    msg.className = '';
    if (abandono) {
        msg.innerText = "Retirado."; msg.style.color = "#ea4335";
    } else if (nota === 100) {
        msg.innerText = "¡LEGENDARIO! 🏆"; msg.style.color = "#28a745"; createConfetti();
    } else if (nota >= 70) {
        msg.innerText = "¡Misión Cumplida!"; msg.style.color = "#fbbc04";
    } else {
        msg.innerText = "Entrenamiento fallido."; msg.style.color = "#ea4335";
    }

    if (currentMode === 'multiplayer') document.getElementById('btn-review').classList.add('hidden');
    else document.getElementById('btn-review').classList.remove('hidden');
}

function escucharResultadosSala() {
    const q = query(collection(db, `salas_activas/${currentRoomId}/resultados`), orderBy("score", "desc"));
    onSnapshot(q, (snap) => {
        const div = document.getElementById('room-leaderboard');
        div.innerHTML = '';
        let pos = 1;
        snap.forEach(d => {
            const data = d.data();
            // Renderizar fila con imagen
            div.innerHTML += `
            <div class="rank-row">
                <span class="rank-pos">#${pos}</span>
                <img src="${data.avatar}" class="rank-img">
                <div class="rank-info">
                    <span class="rank-name">${data.user}</span>
                    <span class="rank-status">${data.status}</span>
                </div>
                <span class="rank-score">${data.score} pts</span>
            </div>`;
            pos++;
        });
    });
}

function guardarHistorialLocal(nota) {
    let h = JSON.parse(localStorage.getItem('my_scores')) || [];
    h.push({ date: new Date().toLocaleDateString(), score: nota });
    localStorage.setItem('my_scores', JSON.stringify(h));
}

function cargarGrafico() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const h = JSON.parse(localStorage.getItem('my_scores')) || [];
    if(window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: { labels: h.map((_, i)=>`#${i+1}`), datasets: [{ label: 'Nota', data: h.map(x=>x.score), borderColor: '#1a73e8', tension: 0.3, fill: true, backgroundColor: 'rgba(26,115,232,0.1)' }] },
        options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });
}

function createConfetti() {
    const w = document.getElementById('confetti-wrapper'); w.classList.remove('hidden'); w.innerHTML = '';
    const c = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335'];
    for(let i=0; i<100; i++) {
        const d = document.createElement('div');
        d.style.position='absolute'; d.style.width='10px'; d.style.height='10px';
        d.style.backgroundColor = c[Math.floor(Math.random()*c.length)];
        d.style.left = Math.random()*100+'vw';
        d.style.animation = `fall ${Math.random()*3+2}s linear forwards`;
        w.appendChild(d);
    }
}

// VOLUMEN
document.getElementById('volume-slider').addEventListener('input', (e) => {
    document.querySelectorAll('audio').forEach(a => { a.volume = e.target.value; a.muted = (e.target.value == 0); });
});
document.getElementById('btn-mute').addEventListener('click', () => {
    const audios = document.querySelectorAll('audio');
    const isMuted = !audios[0].muted;
    audios.forEach(a => a.muted = isMuted);
});
document.getElementById('close-stats').addEventListener('click', () => document.getElementById('stats-modal').classList.add('hidden'));
document.getElementById('btn-review').addEventListener('click', () => {
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');
    const c = document.getElementById('review-container'); c.innerHTML = '';
    preguntasExamen.forEach((p, i) => {
        const ok = respuestasUsuario[i] === p.respuesta;
        let ops = '';
        p.opciones.forEach((o, x) => {
            let cls = (x === p.respuesta) ? 'ans-correct' : (x === respuestasUsuario[i] && !ok ? 'ans-wrong' : '');
            ops += `<div class="review-answer ${cls}">${x === p.respuesta ? '✅' : (x===respuestasUsuario[i]?'❌':'')} ${o}</div>`;
        });
        c.innerHTML += `<div class="review-item"><div class="review-question">${i+1}. ${p.texto}</div>${ops}<div class="review-explanation">${p.explicacion}</div></div>`;
    });
});
