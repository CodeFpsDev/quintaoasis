(function () {
  "use strict";
  const cfg = window.OASIS;
  const svc = window.BookingService;
  const $ = (s) => document.querySelector(s);

  /* ---------- Utilidades de fecha ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function range(a, b) {
    const out = [];
    for (let t = Date.parse(a + "T00:00:00Z"), e = Date.parse(b + "T00:00:00Z"); t <= e; t += 86400000) {
      out.push(new Date(t).toISOString().slice(0, 10));
    }
    return out;
  }
  const fmt = (s, opts) => new Date(s + "T00:00:00Z").toLocaleDateString("es-PY", { timeZone: "UTC", ...opts });
  const fmtShort = (s) => fmt(s, { weekday: "short", day: "numeric", month: "short" });
  const fmtLong = (s) => fmt(s, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fmtRange = (a, b) => (a === b ? fmtShort(a) : `${fmtShort(a)} al ${fmtShort(b)}`);

  function normalizePhone(raw) {
    let d = String(raw || "").replace(/\D/g, "");
    if (d.startsWith("00")) d = d.slice(2);
    if (d.startsWith("0")) d = cfg.countryCode + d.slice(1);
    else if (!d.startsWith(cfg.countryCode) && d.length === 9) d = cfg.countryCode + d;
    return d;
  }

  const contacts = cfg.contacts.map((c) => ({ name: c.name, phone: normalizePhone(c.phone), display: c.phone }));
  const waUrl = (phone, text) => `https://wa.me/${phone}${text ? "?text=" + encodeURIComponent(text) : ""}`;

  /* ---------- Contenido desde config ---------- */
  $("#factCapacity").textContent = `Hasta ${cfg.capacity} personas`;
  $("#factPrice").textContent = cfg.priceText;
  $("#faqPrice").textContent = cfg.priceText + ".";
  document.querySelectorAll("[data-max-days]").forEach((el) => (el.textContent = cfg.maxDays));
  $("#address").textContent = cfg.address;
  $("#footAddress").textContent = cfg.address;
  $("#mapsLink").href = cfg.mapsUrl;

  /* ---------- Contactos de WhatsApp ---------- */
  const hello = (c) => `Hola ${c.name}! Quiero consultar por la Quinta Oasis.`;
  const aLink = (c, cls, label) => `<a class="${cls}" href="${waUrl(c.phone, hello(c))}" target="_blank" rel="noopener">${label}</a>`;
  $("#waLinks").innerHTML = contacts
    .map((c) => aLink(c, "wa-link", `<span>${esc(c.name)}</span><small>${esc(c.display)}</small>`))
    .join("");

  const waBtn = $("#waFloat"), waMenu = $("#waMenu");
  const setWa = (open) => { waMenu.hidden = !open; waBtn.setAttribute("aria-expanded", String(open)); };
  waBtn.addEventListener("click", () => setWa(waMenu.hidden));
  document.addEventListener("click", (e) => { if (!e.target.closest("#waWrap")) setWa(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setWa(false); });

  /* ---------- Ventanita que aparece al reservar ---------- */
  const modal = $("#modal");
  let lastFocus = null;
  function openModal({ name, dates, nDays, guests, demo }) {
    $("#modalText").textContent = `Pediste ${dates} (${nDays} ${nDays === 1 ? "día" : "días"}) para ${guests} ${guests === 1 ? "persona" : "personas"}. Tu pedido queda en espera hasta que se confirme el pago.`;
    $("#modalContacts").innerHTML = contacts
      .map((c) => {
        const text = `Hola ${c.name}! Soy ${name}. Quiero reservar la Quinta Oasis para ${dates} (${guests} personas). ¿Cómo hacemos para confirmar el pago?`;
        return `<a class="btn btn--wa btn--lg" href="${waUrl(c.phone, text)}" target="_blank" rel="noopener">Hablar con ${esc(c.name)}</a>`;
      })
      .join("");
    $("#modalDemo").hidden = !demo;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const first = $("#modalContacts a");
    if (first) first.focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("#modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  const check = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#dff4f2"/><path d="M7 12.5l3.200 3.200L17 9" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  $("#amenities").innerHTML = cfg.amenities.map((a) => `<li>${check}<span>${esc(a)}</span></li>`).join("");

  $("#mosaic").innerHTML = cfg.gallery
    .map((g) => `<figure class="tile" style="margin:0"><button type="button" class="tile__btn" aria-label="Ver en pantalla completa: ${esc(g.alt)}"><img src="${esc(g.src)}" alt="" loading="lazy" onerror="this.parentElement.disabled=true;this.remove()"><span class="tile__ph">${esc(g.alt)}</span></button></figure>`)
    .join("");
  // si la foto carga, ocultar el texto de ejemplo
  document.querySelectorAll(".tile img").forEach((img) => {
    const hideCaption = () => { const c = img.parentElement && img.parentElement.querySelector(".tile__ph"); if (c) c.remove(); };
    if (img.complete && img.naturalWidth > 0) hideCaption();
    else img.addEventListener("load", hideCaption);
  });

  /* ---------- Visor de fotos a pantalla completa ---------- */
  const lb = $("#lightbox"), lbImg = $("#lbImg");
  let lbItems = [], lbIndex = 0, lbLast = null;

  function lbShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const it = lbItems[lbIndex];
    lbImg.src = it.src;
    lbImg.alt = it.alt;
    $("#lbCap").textContent = it.alt;
    $("#lbCount").textContent = `${lbIndex + 1} de ${lbItems.length}`;
    // precargar las vecinas para que el cambio sea instantáneo
    [1, -1].forEach((d) => { new Image().src = lbItems[(lbIndex + d + lbItems.length) % lbItems.length].src; });
  }
  function lbOpen(src) {
    // solo las fotos que cargaron bien (el alt de la foto está en el botón)
    lbItems = [...document.querySelectorAll(".tile__btn")]
      .filter((b) => b.querySelector("img"))
      .map((b) => ({ src: b.querySelector("img").getAttribute("src"), alt: b.querySelector(".tile__ph") ? b.querySelector(".tile__ph").textContent : (cfg.gallery.find((g) => g.src === b.querySelector("img").getAttribute("src")) || {}).alt || "" }));
    if (!lbItems.length) return;
    const single = lbItems.length < 2;
    $("#lbPrev").hidden = single;
    $("#lbNext").hidden = single;
    lbLast = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lbShow(Math.max(0, lbItems.findIndex((x) => x.src === src)));
    $("#lbClose").focus();
  }
  function lbClose() {
    if (lb.hidden) return;
    lb.hidden = true;
    lbImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (lbLast && lbLast.focus) lbLast.focus();
  }

  $("#mosaic").addEventListener("click", (e) => {
    const btn = e.target.closest(".tile__btn");
    const img = btn && btn.querySelector("img");
    if (img) lbOpen(img.getAttribute("src"));
  });
  $("#lbClose").addEventListener("click", lbClose);
  $("#lbPrev").addEventListener("click", () => lbShow(lbIndex - 1));
  $("#lbNext").addEventListener("click", () => lbShow(lbIndex + 1));
  // tocar el fondo oscuro (no la foto) cierra el visor
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb__stage")) lbClose(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowRight") lbShow(lbIndex + 1);
    else if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
    else if (e.key === "Tab") {
      // el foco se queda dentro del visor
      const f = [$("#lbClose"), $("#lbPrev"), $("#lbNext")].filter((b) => !b.hidden);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  // deslizar con el dedo
  let touchX = null;
  lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
  });

  /* ---------- Navegación ---------- */
  const nav = $("#nav"), toggle = $("#navToggle");
  function onScroll() { nav.classList.toggle("is-solid", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $("#navMenu").addEventListener("click", (e) => {
    if (e.target.closest("a")) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- Calendario y pedido ---------- */
  const today = svc.todayStr();
  const [ty, tm] = today.split("-").map(Number);
  let year = ty, month = tm - 1;
  let unavailable = new Set(), pending = new Set();
  let start = null, end = null;
  const MONTHS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  function dayClass(s) {
    if (s < today) return "past";
    if (unavailable.has(s)) return "busy";
    if (pending.has(s)) return "wait";
    return "free";
  }

  function renderCalendar() {
    const first = new Date(Date.UTC(year, month, 1));
    const nDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const rawTitle = first.toLocaleDateString("es-PY", { month: "long", year: "numeric", timeZone: "UTC" });
    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    const atMin = year === ty && month === tm - 1;
    let h = `<div class="cal__head">
      <button type="button" class="cal__nav" data-nav="-1" aria-label="Mes anterior" ${atMin ? "disabled" : ""}>‹</button>
      <div class="cal__title" aria-live="polite">${title}</div>
      <button type="button" class="cal__nav" data-nav="1" aria-label="Mes siguiente">›</button>
    </div><div class="cal__grid">`;
    MONTHS_SHORT.forEach((d) => (h += `<div class="cal__dow" aria-hidden="true">${d}</div>`));
    for (let i = 0; i < first.getUTCDay(); i++) h += "<div></div>";
    for (let d = 1; d <= nDays; d++) {
      const s = ymd(year, month, d);
      const k = dayClass(s);
      const inSel = start && s >= start && s <= end;
      const edge = inSel && (s === start || s === end);
      const cls = ["day", `day--${inSel ? "sel" : k}`, edge ? "day--edge" : "", s === today ? "day--today" : ""].join(" ");
      const state = k === "busy" ? "ocupado" : k === "wait" ? "en espera" : k === "past" ? "pasado" : "libre";
      const disabled = k !== "free" ? "disabled" : "";
      h += `<button type="button" class="${cls}" data-date="${s}" ${disabled} aria-pressed="${inSel ? "true" : "false"}" aria-label="${fmtLong(s)}, ${state}">${d}</button>`;
    }
    $("#calendar").innerHTML = h + "</div>";
  }

  function showMsg(type, html) { $("#msg").innerHTML = `<div class="notice notice--${type}">${html}</div>`; }

  function refresh() {
    renderCalendar();
    const box = $("#summary");
    if (start) {
      const n = range(start, end).length;
      box.className = "summary";
      box.textContent = `${fmtRange(start, end)} · ${n} ${n === 1 ? "día" : "días"}`;
    } else {
      box.className = "summary summary--empty";
      box.textContent = "Todavía no elegiste fechas.";
    }
    $("#send").disabled = !start;
  }

  function pick(s) {
    $("#msg").innerHTML = "";
    const hasRange = start && end && start !== end;
    if (!start || hasRange || s < start) { start = end = s; }
    else if (s > start) {
      const days = range(start, s);
      if (days.length > cfg.maxDays) {
        showMsg("err", `Podés pedir hasta ${cfg.maxDays} días seguidos. Elegí un rango más corto.`);
        start = end = s;
      } else if (days.some((d) => unavailable.has(d) || pending.has(d))) {
        showMsg("err", "En ese rango hay días ocupados o en espera. Elegí otras fechas.");
        start = end = s;
      } else { end = s; }
    }
    refresh();
  }

  $("#calendar").addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]");
    if (nav && !nav.disabled) {
      month += Number(nav.dataset.nav);
      if (month < 0) { month = 11; year--; }
      if (month > 11) { month = 0; year++; }
      renderCalendar();
      return;
    }
    const day = e.target.closest(".day");
    if (day && !day.disabled) pick(day.dataset.date);
  });

  svc.subscribe((state) => {
    unavailable = new Set(state.unavailable);
    pending = new Set(state.pending);
    if (start && range(start, end).some((d) => unavailable.has(d) || pending.has(d))) {
      start = end = null;
      showMsg("err", "Alguno de los días que elegiste acaba de ocuparse. Elegí otras fechas.");
    }
    refresh();
  }, () => showMsg("err", "No se pudo cargar la disponibilidad. Revisá tu conexión y recargá la página."));

  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!start) return;
    const name = $("#name").value.trim().replace(/\s+/g, " ");
    const phone = normalizePhone($("#phone").value);
    const guests = parseInt($("#guests").value, 10);
    if (name.length < 2) return showMsg("err", "Escribí tu nombre y apellido.");
    if (phone.length < 10 || phone.length > 15) return showMsg("err", "Revisá tu número de WhatsApp. Ejemplo: 0981 123 456.");
    if (!(guests >= 1 && guests <= 200)) return showMsg("err", "Indicá cuántas personas van.");
    if ($("#website").value) return;

    const btn = $("#send");
    btn.disabled = true;
    btn.textContent = "Enviando…";
    try {
      const res = await svc.submit({ name, phone, guests, checkIn: start, checkOut: end });
      const dates = fmtRange(start, end);
      const nDays = range(start, end).length;
      $("#msg").innerHTML = "";
      start = end = null;
      $("#form").reset();
      $("#guests").value = 10;
      refresh();
      openModal({ name, dates, nDays, guests, demo: Boolean(res.demo) });
    } catch (err) {
      showMsg("err", err && err.code === "unavailable"
        ? "Alguno de esos días ya no está libre. Mirá el calendario y elegí otras fechas."
        : "No se pudo enviar el pedido. Revisá tu conexión y probá de nuevo.");
    } finally {
      btn.textContent = "Reservar esta fecha";
      btn.disabled = !start;
    }
  });

  refresh();
})();
