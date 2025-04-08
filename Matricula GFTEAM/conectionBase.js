
// https://firebase.google.com/docs/web/setup#available-libraries

// Configuração do Firebase
var firebaseConfig = {
  apiKey: "AIzaSyBbx2ggravKAAwq_QFM1WIHHV82259GaP4",
  authDomain: "gf-team-542b5.firebaseapp.com",
  projectId: "gf-team-542b5",
  storageBucket: "gf-team-542b5.appspot.com",
  messagingSenderId: "877453744574",
  appId: "1:877453744574:web:ade69975cc4aec49d181ef"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Torna a instância do Firestore acessível globalmente
const db = firebase.firestore();


