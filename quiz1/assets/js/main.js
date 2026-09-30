import { animateMapMarkers, initImageLoad, initReveal, initScrollEffects, initSmoothScroll } from "./motion.js?v=20260930";

const BASE = "/quiz1";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const lenis = initSmoothScroll();

// Teks yang dibuat JavaScript, dalam dua bahasa.
const TEXT = {
  id: { openMenu: "Buka menu", closeMenu: "Tutup menu", mapError: "Peta tidak dapat dimuat.", switchLang: "Ganti bahasa ke English" },
  en: { openMenu: "Open menu", closeMenu: "Close menu", mapError: "The map could not be loaded.", switchLang: "Switch language to Bahasa Indonesia" },
};
const currentLang = () => (document.documentElement.lang === "en" ? "en" : "id");
const t = (key) => TEXT[currentLang()][key];

const sections = [...document.querySelectorAll("[data-route]")];
const routes = new Map(sections.map((section) => [section.dataset.route, section]));
const navLinks = [...document.querySelectorAll(".site-nav__link")];

// Saat smooth scroll hasil klik sedang berjalan, scroll-spy tidak boleh
// menimpa URL dengan section yang hanya dilewati.
let spyPaused = false;
let spyTimer = 0;

function routeFromPath(pathname) {
  const slug = pathname.replace(/^\/quiz1/, "").replace(/^\/+|\/+$/g, "");
  return slug;
}

function pathFor(route) {
  return route ? `${BASE}/${route}` : BASE;
}

function scrollBehavior() {
  return reduceMotion.matches ? "auto" : "smooth";
}

function setActiveNav(route) {
  for (const link of navLinks) {
    if (link.dataset.section === (route || "home")) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function setDocumentState(route) {
  const section = routes.get(route);
  const title = currentLang() === "en" ? section?.dataset.titleEn : section?.dataset.title;
  document.title = title ?? section?.dataset.title ?? "Ngalam";
  setActiveNav(route);
}

function scrollToSection(route, behavior, onDone) {
  const target = route ? routes.get(route) : null;

  if (lenis) {
    // Jarak header sudah dihitung Lenis dari scroll-margin-top section di CSS.
    lenis.scrollTo(target ?? 0, {
      immediate: behavior !== "smooth",
      force: true,
      duration: 1.4,
      onComplete: onDone,
    });
    return;
  }

  if (target) target.scrollIntoView({ behavior, block: "start" });
  else window.scrollTo({ top: 0, behavior });
  if (onDone && "onscrollend" in window) window.addEventListener("scrollend", onDone, { once: true });
}

// Mengembalikan fungsi untuk melepas tahanan scroll-spy setelah scroll selesai.
function pauseSpy() {
  spyPaused = true;
  clearTimeout(spyTimer);
  const release = () => {
    clearTimeout(spyTimer);
    spyTimer = setTimeout(() => {
      spyPaused = false;
    }, 120);
  };
  // Cadangan jika tidak ada sinyal selesai (browser tanpa scrollend, atau halaman tidak bergulir).
  spyTimer = setTimeout(() => {
    spyPaused = false;
  }, 2000);
  return release;
}

function goTo(route, { push = true, smooth = true, focus = true } = {}) {
  if (!routes.has(route)) route = "";
  const path = pathFor(route);

  if (push && location.pathname.replace(/\/$/, "") !== path) {
    history.pushState({ route }, "", path);
  }

  setDocumentState(route);
  const behavior = smooth ? scrollBehavior() : "auto";
  // Scroll instan tidak melewati section lain, jadi scroll-spy tidak perlu ditahan.
  const release = behavior === "smooth" ? pauseSpy() : undefined;
  scrollToSection(route, behavior, release);

  if (focus) {
    const heading = routes.get(route)?.querySelector("[tabindex='-1']");
    heading?.focus({ preventScroll: true });
  }
}

function initRouter() {
  history.scrollRestoration = "manual";
  const initial = routeFromPath(location.pathname);

  if (!routes.has(initial)) {
    history.replaceState({ route: "" }, "", BASE);
    goTo("", { push: false, smooth: false, focus: false });
  } else {
    goTo(initial, { push: false, smooth: false, focus: false });
    // Font web mengubah tinggi halaman setelah dimuat; posisikan ulang agar judul section tetap di atas.
    document.fonts?.ready.then(() => {
      if (routeFromPath(location.pathname) === initial) scrollToSection(initial, "auto");
    });
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank") return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname !== BASE && !url.pathname.startsWith(`${BASE}/`)) return;

    const route = routeFromPath(url.pathname);
    if (!routes.has(route)) return;

    event.preventDefault();
    closeNav();
    goTo(route);
  });

  window.addEventListener("popstate", () => {
    goTo(routeFromPath(location.pathname), { push: false });
  });
}

function initScrollSpy() {
  // Section aktif = section terakhir yang bagian atasnya sudah melewati garis
  // sepertiga atas layar. Dibandingkan per posisi, bukan per rasio luas, karena
  // tinggi tiap section sangat berbeda.
  let ticking = false;

  function update() {
    ticking = false;
    if (spyPaused) return;

    const line = window.innerHeight / 3;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section;
    }
    // Di dasar halaman, section terakhir dianggap aktif walau judulnya belum sampai garis.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }

    const route = current.dataset.route;
    const path = pathFor(route);
    if (location.pathname.replace(/\/$/, "") !== path) {
      history.replaceState({ route }, "", path);
    }
    setDocumentState(route);
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

function closeNav() {
  if (!navToggle || navToggle.getAttribute("aria-expanded") !== "true") return;
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", t("openMenu"));
  siteNav.classList.remove("is-open");
  lenis?.start();
}

function initNavToggle() {
  if (!navToggle || !siteNav) return;

  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") !== "true";
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? t("closeMenu") : t("openMenu"));
    siteNav.classList.toggle("is-open", open);
    if (open) lenis?.stop();
    else lenis?.start();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      closeNav();
      navToggle.focus();
    }
  });
}

function initFoodFilter() {
  const group = document.querySelector("[data-filter]");
  if (!group) return;

  const buttons = [...group.querySelectorAll("[data-filter-value]")];
  const items = [...document.querySelectorAll(".food-item[data-category]")];
  const empty = document.querySelector("[data-filter-empty]");
  const reset = document.querySelector("[data-filter-reset]");

  function apply(value) {
    let shown = 0;
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.filterValue === value));
    }
    for (const item of items) {
      const match = value === "all" || item.dataset.category === value;
      item.classList.toggle("is-filtered-out", !match);
      if (match) {
        shown += 1;
        // Mulai ulang animasi masuk untuk item yang tampil setelah filter berganti.
        item.classList.remove("is-entering");
        void item.offsetWidth;
        item.classList.add("is-entering");
      }
    }
    if (empty) empty.hidden = shown > 0;
  }

  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter-value]");
    if (button) apply(button.dataset.filterValue);
  });

  reset?.addEventListener("click", () => {
    apply("all");
    buttons[0]?.focus();
  });
}

function initLightbox() {
  const dialog = document.querySelector("[data-lightbox-dialog]");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const stage = dialog.querySelector("[data-lightbox-stage]");
  const caption = dialog.querySelector("[data-lightbox-caption]");
  const close = dialog.querySelector("[data-lightbox-close]");
  let opener = null;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox]");
    if (!trigger) return;

    opener = trigger;
    const media = trigger.querySelector("[data-media], .ph, img");
    const place = trigger.closest(".place");
    // innerText hanya mengambil teks bahasa yang sedang tampil.
    const name = place?.querySelector(".place__name")?.innerText.trim() ?? "";
    const credit = trigger.closest("figure")?.querySelector(".caption")?.innerText.trim() ?? "";

    const copy = media.cloneNode(true);
    // Salinan di lightbox tidak ikut animasi tirai atau parallax.
    copy.removeAttribute("data-media");
    copy.removeAttribute("data-parallax");
    copy.classList.remove("is-hidden");
    copy.style.removeProperty("--parallax");
    // Foto asli di lightbox memakai versi terbesar dari srcset.
    for (const img of copy.querySelectorAll("img")) {
      img.sizes = "min(100vw, 1200px)";
      img.loading = "eager";
      img.classList.remove("is-loading");
    }
    stage.replaceChildren(copy);
    caption.replaceChildren(document.createTextNode(name));
    if (credit) {
      const small = document.createElement("small");
      small.textContent = credit;
      caption.append(small);
    }
    dialog.showModal();
    lenis?.stop();
    close.focus();
  });

  close.addEventListener("click", () => dialog.close());

  // Klik di luar foto dan caption menutup lightbox.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    lenis?.start();
    stage.replaceChildren();
    opener?.focus();
  });
}

const MAP_POINTS = [
  { name: { id: "Malang", en: "Malang" }, lat: -7.9797, lng: 112.6304, kind: "main" },
  { name: { id: "Coban Rondo", en: "Coban Rondo" }, lat: -7.8847, lng: 112.4769, kind: "left" },
  { name: { id: "Gunung Bromo", en: "Mount Bromo" }, lat: -7.9425, lng: 112.953, kind: "right" },
];

// Zoom bilangan bulat: zoom pecahan membuat garis sambungan terlihat di antara tile.
const MAP_VIEWS = {
  wide: { center: [-7.75, 112.75], zoom: 9 },
  narrow: { center: [-7.95, 112.7], zoom: 8 },
};

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = `${BASE}/assets/vendor/leaflet/leaflet.css`;
  document.head.append(css);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${BASE}/assets/vendor/leaflet/leaflet.js`;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.append(script);
  });
}

function showMapError(container) {
  container.replaceChildren();
  container.className = "map";
  const message = document.createElement("p");
  message.className = "map__fallback";
  message.innerHTML = `<span lang="id">${TEXT.id.mapError}</span><span lang="en">${TEXT.en.mapError}</span>`;
  container.append(message);
}

function buildMap(L, container) {
  const key = window.NGALAM_CONFIG?.cartoKey;
  if (!key) {
    showMapError(container);
    return;
  }

  container.replaceChildren();
  const narrowQuery = window.matchMedia("(max-width: 639px)");

  const map = L.map(container, {
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    zoomControl: false,
    attributionControl: true,
  });
  map.attributionControl.setPrefix(false);

  const tiles = L.tileLayer(
    `https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`,
    {
      subdomains: "abcd",
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors, © CARTO",
    },
  );

  // Jika tile gagal dan tidak satu pun berhasil dimuat, peta dianggap gagal.
  let loaded = 0;
  let failTimer = 0;
  tiles.on("tileload", () => {
    loaded += 1;
  });
  tiles.on("tileerror", () => {
    clearTimeout(failTimer);
    failTimer = setTimeout(() => {
      if (loaded > 0) return;
      window.removeEventListener("resize", fit);
      map.remove();
      showMapError(container);
    }, 800);
  });
  tiles.addTo(map);

  for (const point of MAP_POINTS) {
    const html = `<span class="map-marker map-marker--${point.kind}"><span class="map-marker__dot"></span><span class="map-marker__label"><span lang="id">${point.name.id}</span><span lang="en">${point.name.en}</span></span></span>`;
    L.marker([point.lat, point.lng], {
      icon: L.divIcon({ className: "map-marker-icon", html, iconSize: [0, 0], iconAnchor: [0, 0] }),
      keyboard: false,
      interactive: false,
    }).addTo(map);
  }

  const fit = () => {
    const view = narrowQuery.matches ? MAP_VIEWS.narrow : MAP_VIEWS.wide;
    map.invalidateSize();
    map.setView(view.center, view.zoom, { animate: false });
  };
  fit();
  window.addEventListener("resize", fit);

  animateMapMarkers(container);
}

function initMap() {
  const container = document.querySelector("[data-map]");
  if (!container) return;

  const start = () => {
    loadLeaflet()
      .then((L) => buildMap(L, container))
      .catch(() => showMapError(container));
  };

  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }

  // Leaflet baru dimuat saat section Kota mendekati layar.
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        start();
      }
    },
    { rootMargin: "600px 0px" },
  );
  observer.observe(container);
}

const LANG_KEY = "ngalam-lang";
const I18N_ATTRS = ["alt", "aria-label"];

// Menukar atribut yang punya versi Inggris (data-en-alt, data-en-aria-label).
// Versi Indonesia disimpan sekali di data-id-* agar bisa dikembalikan.
function applyAttributes(lang) {
  for (const attr of I18N_ATTRS) {
    for (const el of document.querySelectorAll(`[data-en-${attr}]`)) {
      const saved = `data-id-${attr}`;
      if (!el.hasAttribute(saved)) el.setAttribute(saved, el.getAttribute(attr) ?? "");
      el.setAttribute(attr, lang === "en" ? el.getAttribute(`data-en-${attr}`) : el.getAttribute(saved));
    }
  }
}

function setLanguage(lang, { save = true } = {}) {
  document.documentElement.lang = lang;
  applyAttributes(lang);
  const toggle = document.querySelector("[data-lang-toggle]");
  toggle?.setAttribute("aria-label", t("switchLang"));
  if (navToggle) {
    navToggle.setAttribute("aria-label", navToggle.getAttribute("aria-expanded") === "true" ? t("closeMenu") : t("openMenu"));
  }
  setDocumentState(routeFromPath(location.pathname));
  if (save) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Penyimpanan diblokir (mode privat): pilihan bahasa hanya berlaku di halaman ini.
    }
  }
}

function initLanguage() {
  const toggle = document.querySelector("[data-lang-toggle]");
  // Bahasa awal sudah dipasang skrip di <head>; di sini tinggal menyelaraskan atribut dan label.
  setLanguage(currentLang(), { save: false });
  toggle?.addEventListener("click", () => {
    setLanguage(currentLang() === "en" ? "id" : "en");
  });
}

initNavToggle();
initLanguage();
initRouter();
initScrollSpy();
initReveal();
initImageLoad();
initScrollEffects(lenis);
initFoodFilter();
initLightbox();
initMap();
