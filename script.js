// 1. IMPORTAR FIREBASE (Usando los enlaces CDN para que funcione en web)
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

// 2. CONFIGURACIÓN FIREBASE (PROYECTO: autenticacion-8faac)
// ESTA ES LA QUE FUNCIONA
const firebaseConfig = {
  apiKey: "AIzaSyAMQpnPJSdicgo5gungVOE0M7OHwkz4P9Y",
  authDomain: "autenticacion-8faac.firebaseapp.com",
  projectId: "autenticacion-8faac",
  storageBucket: "autenticacion-8faac.firebasestorage.app",
  messagingSenderId: "939518706600",
  appId: "1:939518706600:web:d28c3ec7de21da8379939d",
  measurementId: "G-8LXM9VS1M0"
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
    "ehidalgoc4@unemi
