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

// 2. CONFIGURACIÓN FIREBASE
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

// --- LISTA DE CORREOS PERMITIDOS (WHITELIST) ---
const correosPermitidos = [
    "dpachecog2@unemi.edu.ec", 
    "cnavarretem4@unemi.edu.ec", 
    "htigrer@unemi.edu.ec", 
    "gorellanas2@unemi.edu.ec", 
    "iastudillol@unemi.edu.ec", 
    "sgavilanezp2@unemi.edu.ec", 
    "jzamoram9@unemi.edu.ec", 
    "fcarrillop@unemi.edu.ec", 
    "naguilarb@unemi.edu.ec", 
    "ehidalgoc4@unemi.edu.ec", 
    "lbrionesg3@unemi.edu.ec", 
    "xsalvadorv@unemi.edu.ec", 
    "nbravop4@unemi.edu.ec", 
    "jmoreirap6@unemi.edu.ec", 
    "kholguinb2@unemi.edu.ec",
    "ky211209@gmail.com" // Agregué el tuyo por si acaso para pruebas, bórralo si quieres
];

// --- PREGUNTAS ---
const preguntas = [
    { texto: "¿Qué categoría de activo abarca servidores, routers y estaciones de trabajo?", opciones: ["Data", "Lines & Networks", "Hardware", "Software"], respuesta: 2 },
    { texto: "Una amenaza ambiental típica para un centro de datos sería:", opciones: ["Huracán", "Robo de servidores", "Virus informático", "Pérdida de energía"], respuesta: 0 },
    { texto: "¿Qué nivel de riesgo requiere medidas inmediatas según la tabla de niveles?", opciones: ["Alto/Extremo", "Bajo", "Negligible", "Medio"], respuesta: 0 },
    { texto: "El estándar OWASP ASVS se utiliza para:", opciones: ["Generar certificados SSL", "Probar hardware", "Cifrado TLS", "Verificar controles de seguridad en aplicaciones"], respuesta: 3 }
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

// --- LÓGICA DE VALIDACIÓN DE USUARIOS ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        // 1. Verificamos si el correo está en la lista permitida
        if (correosPermitidos.includes(user.email)) {
            // ACCESO CONCEDIDO
            console.log("Bienvenido: " + user.email);
            authScreen.classList.add('hidden');
            setupScreen.classList.remove('hidden');
            btnLogout.classList.remove('hidden');
            document.getElementById('user-display').innerText = user.email;
        } else {
            // ACCESO DENEGADO
            alert("ACCESO DENEGADO: El correo " + user.email + " no está autorizado para usar este simulador.");
            signOut(auth); // Lo expulsamos inmediatamente
        }
    } else {
        // Nadie logueado
        authScreen.classList.remove('hidden');
        setupScreen.classList.add('hidden');
        quizScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        btnLogout.classList.add('hidden');
    }
});

// Botón Login
document.getElementById('btn-login').addEventListener('click', () => {
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('pass-input').value;
    signInWithEmailAndPassword(auth, email, pass).catch((error) => alert("Error: " + error.message));
});

// Botón Registro (Opcional: Quizás quieras quitarlo si solo entran los de la lista)
document.getElementById('btn-register').addEventListener('click', () => {
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('pass-input').value;
    
    // Verificamos antes de crear la cuenta si está permitido
    if (!correosPermitidos.includes(email)) {
        alert("No puedes registrarte. Tu correo no está en la lista de autorizados.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, pass)
        .then(() => alert("Cuenta creada."))
        .catch((error) => alert("Error: " + error.message));
});

// Botón Google
document.getElementById('btn-google').addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
        console.error(error);
        alert("Error al conectar con Google. Verifica 'Dominios Autorizados' en Firebase.");
    });
});

// Botón Salir
btnLogout.addEventListener('click', () => {
    signOut(auth);
    location.reload();
});

// --- LÓGICA DEL EXAMEN ---
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
    setTimeout(() => { indiceActual++; cargarPregunta(); }, 1500);
}

function iniciarReloj() {
    intervaloTiempo = setInterval(() => {
        tiempoRestante--;
        let m = Math.floor(tiempoRestante / 60);
        let s = tiempoRestante % 60;
        document.getElementById('timer-display').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (tiempoRestante <= 0) { clearInterval(intervaloTiempo); terminarQuiz(); }
    }, 1000);
}

function terminarQuiz() {
    clearInterval(intervaloTiempo);
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('score-final').innerText = `${puntaje} / ${preguntas.length}`;
}
