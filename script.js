// 1. IMPORTAR FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 2. TU CONFIGURACIÓN (Recuperada de tus imágenes)
const firebaseConfig = {
  apiKey: "AIzaSyBU1oaDdq6qD4fTiLN4lSAeQg6Kp06gDXk", 
  authDomain: "simulador-tics.firebaseapp.com",
  projectId: "simulador-tics",
  storageBucket: "simulador-tics.firebasestorage.app",
  messagingSenderId: "501091859008",
  appId: "1:501091859008:web:80e4596d2adcb5adbf7da5", 
  measurementId: "G-5LFLE4MBPH"
};

// 3. INICIALIZAR
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- LÓGICA DEL SIMULADOR ---
const preguntas = [
    { texto: "¿Cuál de los siguientes NO es un pilar de la triada CIA?", opciones: ["Confidencialidad", "Integridad", "Autenticación", "Disponibilidad"], respuesta: 2 },
    { texto: "¿Qué tipo de ataque utiliza ingeniería social?", opciones: ["DDoS", "Phishing", "SQL Injection", "Man-in-the-Middle"], respuesta: 1 },
    { texto: "Herramienta para análisis de paquetes de red:", opciones: ["Photoshop", "Wireshark", "Excel", "Visual Studio"], respuesta: 1 },
    { texto: "¿Puerto por defecto de HTTPS?", opciones: ["80", "21", "443", "22"], respuesta: 2 },
    { texto: "En criptografía asimétrica, ¿qué clave es pública?", opciones: ["Clave Privada", "Clave Pública", "Clave Maestra", "Clave de Sesión"], respuesta: 1 }
];

let indiceActual = 0;
let puntaje = 0;
let tiempoRestante = 0;
let intervaloTiempo;

// REFERENCIAS HTML
const authScreen = document.getElementById('auth-screen');
const setupScreen = document.getElementById('setup-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const btnLogout = document.getElementById('btn-logout');

// --- AUTENTICACIÓN ---

// Verificar si ya está logueado al entrar
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario conectado -> Mostrar Simulador
        authScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
        document.getElementById('user-display').innerText = user.email;
    } else {
        // Nadie conectado -> Mostrar Login
        authScreen.classList.remove('hidden');
        setupScreen.classList.add('hidden');
        quizScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        btnLogout.classList.add('hidden');
    }
});

// Botón: Iniciar Sesión (Email/Pass)
document.getElementById('btn-login').addEventListener('click', () => {
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('pass-input').value;
    signInWithEmailAndPassword(auth, email, pass)
        .catch((error) => alert("Error: " + error.message));
});

// Botón: Registrarse
document.getElementById('btn-register').addEventListener('click', () => {
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('pass-input').value;
    createUserWithEmailAndPassword(auth, email, pass)
        .then(() => alert("Cuenta creada y sesión iniciada!"))
        .catch((error) => alert("Error: " + error.message));
});

// Botón: Google
document.getElementById('btn-google').addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => console.error(error));
});

// Botón: Salir
btnLogout.addEventListener('click', () => {
    signOut(auth);
    location.reload(); // Recargar página para limpiar todo
});


// --- LÓGICA DEL JUEGO (Igual que antes) ---

document.getElementById('btn-start').addEventListener('click', () => {
    const tiempo = document.getElementById('time-select').value;
    if (tiempo !== 'infinity') {
        tiempoRestante = parseInt(tiempo) * 60;
        iniciarReloj();
    } else {
        document.getElementById('timer-display').innerText = "--:--";
    }
    setupScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    cargarPregunta();
});

function cargarPregunta() {
    if (indiceActual >= preguntas.length) {
        terminarQuiz();
        return;
    }
    const data = preguntas[indiceActual];
    document.getElementById('question-text').innerText = `${indiceActual + 1}. ${data.texto}`;
    const cont = document.getElementById('options-container');
    cont.innerHTML = '';

    data.opciones.forEach((opcion, index) => {
        const btn = document.createElement('button');
        btn.innerText = opcion;
        btn.onclick = () => verificarRespuesta(index, btn);
        cont.appendChild(btn);
    });
    document.getElementById('progress-display').innerText = `Pregunta ${indiceActual + 1} de ${preguntas.length}`;
}

function verificarRespuesta(index, btn) {
    const correcta = preguntas[indiceActual].respuesta;
    const botones = document.getElementById('options-container').querySelectorAll('button');
    botones.forEach(b => b.disabled = true);

    if (index === correcta) {
        btn.classList.add('correct');
        puntaje++;
    } else {
        btn.classList.add('incorrect');
        botones[correcta].classList.add('correct');
    }
    setTimeout(() => {
        indiceActual++;
        cargarPregunta();
    }, 1500);
}

function iniciarReloj() {
    intervaloTiempo = setInterval(() => {
        tiempoRestante--;
        let m = Math.floor(tiempoRestante / 60);
        let s = tiempoRestante % 60;
        document.getElementById('timer-display').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (tiempoRestante <= 0) {
            clearInterval(intervaloTiempo);
            terminarQuiz();
        }
    }, 1000);
}

function terminarQuiz() {
    clearInterval(intervaloTiempo);
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('score-final').innerText = `${puntaje} / ${preguntas.length}`;
}
