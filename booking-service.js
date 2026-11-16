/* ==========================================================
   Servicio de reservas de la landing.
   La página solo usa estas dos funciones:

     subscribe(callback, onError)
         callback({ unavailable:[fechas], pending:[fechas] }) ahora y cada
         vez que cambia la disponibilidad. Devuelve una función para dejar
         de escuchar.
     submit(pedido)
         guarda el pedido. Falla con { code: "unavailable" } si algún día
         ya no está libre.

   Con los datos de Firebase en config.js usa la base real; si no,
   funciona en MODO DEMOSTRACIÓN con fechas de ejemplo.
   ========================================================== */
(function () {
  "use strict";
  const cfg = window.OASIS;
  const FB = window.OasisFirebase;

  const todayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: cfg.timezone });
  const addDays = (s, n) => new Date(Date.parse(s + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
  const range = (a, b) => {
    const out = [];
    for (let t = Date.parse(a + "T00:00:00Z"), e = Date.parse(b + "T00:00:00Z"); t <= e; t += 86400000) out.push(new Date(t).toISOString().slice(0, 10));
    return out;
  };

  /* ---------- Modo demostración ---------- */
  function demoService() {
    const t = todayStr();
    const state = {
      unavailable: [...range(addDays(t, 6), addDays(t, 8)), ...range(addDays(t, 20), addDays(t, 21))],
      pending: range(addDays(t, 13), addDays(t, 14)),
    };
    return {
      todayStr,
      subscribe(callback) {
        callback({ unavailable: [...state.unavailable], pending: [...state.pending] });
        return () => {};
      },
      submit(request) {
        return new Promise((resolve) => setTimeout(() => resolve({ ok: true, demo: true, request }), 700));
      },
    };
  }

  /* ---------- Firebase ---------- */
  function firebaseService() {
    return {
      todayStr,
      subscribe(callback, onError) {
        let unsub = () => {}, cancelled = false;
        const fail = (err) => { console.error(err); if (onError) onError(err); };
        FB.load().then(({ fs, db }) => {
          if (cancelled) return;
          unsub = fs.onSnapshot(fs.collection(db, "days"), (snap) => {
            const unavailable = [], pending = [];
            snap.forEach((d) => { (d.data().state === "pending" ? pending : unavailable).push(d.id); });
            callback({ unavailable, pending });
          }, fail);
        }).catch(fail);
        return () => { cancelled = true; unsub(); };
      },

      async submit({ name, phone, guests, checkIn, checkOut }) {
        const { fs, db } = await FB.load();
        const days = range(checkIn, checkOut);
        const ref = fs.doc(fs.collection(db, "requests"));
        const batch = fs.writeBatch(db);
        // El pedido y los días "en espera" se guardan juntos: o entra todo o no entra nada.
        batch.set(ref, { name, phone, guests, checkIn, checkOut, days, status: "pending", createdAt: fs.serverTimestamp() });
        days.forEach((d) => batch.set(fs.doc(db, "days", d), { state: "pending", requestId: ref.id }));
        try {
          await batch.commit();
        } catch (err) {
          console.error(err);
          // Si otro cliente ya tomó alguno de los días, Firebase rechaza la escritura.
          throw Object.assign(new Error("No se pudo enviar el pedido"), { code: err.code === "permission-denied" ? "unavailable" : "failed" });
        }
        return { ok: true, demo: false };
      },
    };
  }

  window.BookingService = FB && FB.enabled ? firebaseService() : demoService();
})();
