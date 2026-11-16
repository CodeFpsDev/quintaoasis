/* ==========================================================
   Carga de Firebase (solo si config.js tiene los datos reales).
   Si no, enabled = false y las páginas usan el modo demostración.
   ========================================================== */
(function () {
  "use strict";
  const fb = (window.OASIS && window.OASIS.firebase) || {};
  const enabled = Boolean(fb.apiKey) && !String(fb.apiKey).startsWith("PEGAR");
  const base = "https://www.gstatic.com/firebasejs/10.14.1/";
  let core = null, authP = null;

  // App + base de datos (lo usan la landing y el panel)
  function load() {
    if (!core) {
      core = Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js")]).then(([appM, fs]) => {
        const app = appM.initializeApp(fb);
        return { app, fs, db: fs.getFirestore(app) };
      });
    }
    return core;
  }

  // Ingreso con correo y clave (solo el panel)
  function loadAuth() {
    if (!authP) {
      authP = Promise.all([load(), import(base + "firebase-auth.js")]).then(([c, au]) => ({ ...c, au, auth: au.getAuth(c.app) }));
    }
    return authP;
  }

  window.OasisFirebase = { enabled, load, loadAuth };
})();
