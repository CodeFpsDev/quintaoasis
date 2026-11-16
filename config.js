/* ==========================================================
   Datos editables de Quinta Oasis.
   Cambiá los textos de acá y la página se actualiza sola.
   Lo marcado con "CONFIRMAR" son datos de ejemplo.
   ========================================================== */
window.OASIS = {
  name: "Quinta Oasis",

  // Personas con quienes los clientes pueden reservar por WhatsApp.
  // El número se escribe como siempre (con 0 al inicio); la página agrega el código de país.
  contacts: [
    { name: "Juanes", phone: "0973 510 568" },
    { name: "María", phone: "0975 187 964" },
  ],

  // Prefijo que se agrega a los números que empiezan con 0 (Paraguay = 595)
  countryCode: "595",
  timezone: "America/Asuncion",

  // CONFIRMAR: capacidad y precio
  capacity: 150,
  priceText: "Consultá el precio por WhatsApp",

  // Días seguidos que se pueden pedir
  maxDays: 14,

  // Dirección que se muestra y enlace de Google Maps
  address: "Ciudad de Ayolas, Misiones",
  mapsUrl: "https://maps.app.goo.gl/CtLxhTouVb7Tz79m7?g_st=iw",

  // Comodidades que se ven en las fotos. Agregá o quitá las que correspondan
  // (por ejemplo baños, estacionamiento, heladera).
  amenities: [
    "Pileta",
    "Reposeras y sombrillas",
    "Quincho techado",
    "Parrilla de ladrillo",
    "Cocina con mesada y bacha",
    "Mesa larga de madera y sillas",
    "Ventiladores de techo",
    "Jardín con césped",
    "Wi-Fi",
  ],

  // Fotos: están en la carpeta images/ con estos nombres.
  // El orden de esta lista es el orden de la galería (la primera es la grande).
  gallery: [
    { src: "images/foto-1.jpg", alt: "La pileta rodeada de césped, con reposeras blancas y sombrillas" },
    { src: "images/foto-2.jpg", alt: "La pileta con palmeras y una enredadera de flores rosadas" },
    { src: "images/foto-3.jpg", alt: "El quincho techado con una mesa larga de madera" },
    { src: "images/foto-4.jpg", alt: "La parrilla de ladrillo y la cocina del quincho" },
    { src: "images/foto-5.jpg", alt: "Vista completa del quincho, con mesas, sillas y parrilla" },
    { src: "images/foto-6.jpg", alt: "La pileta con sombrillas verdes y el jardín" },
  ],

  // Conexión con Firebase (proyecto quinta-oasis).
  // Estos datos son públicos por diseño: la seguridad está en las reglas de Firestore.
  firebase: {
    apiKey: "AIzaSyDj89NP3KbcXg1iCi4z6uzMNBG1qKY4MgU",
    authDomain: "quinta-oasis.firebaseapp.com",
    projectId: "quinta-oasis",
    storageBucket: "quinta-oasis.firebasestorage.app",
    messagingSenderId: "607676480964",
    appId: "1:607676480964:web:fc84a8b4e446be5d91b891",
  },

  // Usuario interno del panel (solo lo usa el panel de los dueños).
  adminEmail: "panel@quinta-oasis.com",
};
