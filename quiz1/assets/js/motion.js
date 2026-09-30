import Lenis from "/quiz1/assets/vendor/lenis/lenis.mjs";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const wide = window.matchMedia("(min-width: 1024px)");

export const motionAllowed = () => !reduceMotion.matches;

// Scroll berinersia. Sentuhan di HP tetap native (syncTouch: false); klik tautan
// ditangani router, bukan Lenis (anchors: false).
export function initSmoothScroll() {
  if (!motionAllowed()) return null;
  return new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    anchors: false,
    autoRaf: true,
  });
}

// Memecah judul menjadi kata agar tiap kata bisa naik bergiliran.
// Teks tetap utuh di DOM sehingga pembaca layar membacanya seperti biasa.
export function splitWords(root = document) {
  for (const heading of root.querySelectorAll("[data-split]")) {
    const words = heading.textContent.trim().split(/\s+/);
    heading.replaceChildren();
    words.forEach((word, index) => {
      const outer = document.createElement("span");
      outer.className = "word";
      const inner = document.createElement("span");
      inner.className = "word__inner";
      inner.style.setProperty("--i", index);
      inner.textContent = word;
      outer.append(inner);
      heading.append(outer);
      if (index < words.length - 1) heading.append(" ");
    });
  }
}

export function initReveal() {
  if (!motionAllowed() || !("IntersectionObserver" in window)) return;

  document.documentElement.classList.add("js-motion");
  splitWords();

  const targets = [...document.querySelectorAll("[data-reveal], [data-media]")];
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("is-hidden");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );

  for (const target of targets) {
    // Elemen yang sudah terlihat saat halaman dibuka tidak disembunyikan dulu,
    // supaya tidak berkedip hilang lalu muncul lagi.
    const rect = target.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) continue;
    target.classList.add("is-hidden");
    observer.observe(target);
  }
}

// Gambar asli memudar dari buram setelah selesai didekode.
export function initImageLoad() {
  for (const img of document.querySelectorAll("[data-media] img")) {
    if (img.complete && img.naturalWidth > 0) continue;
    img.classList.add("is-loading");
    const done = () => img.classList.remove("is-loading");
    img.addEventListener("load", () => (img.decode ? img.decode().catch(() => {}).then(done) : done()), { once: true });
    img.addEventListener("error", done, { once: true });
  }
}

// Parallax foto besar, parallax hero, dan garis progres baca, semuanya
// diperbarui dalam satu fungsi per frame scroll.
export function initScrollEffects(lenis) {
  const progress = document.querySelector(".masthead__progress");
  const heroMedia = document.querySelector(".hero__media");
  const heroContent = document.querySelector(".hero__content");
  const frames = [...document.querySelectorAll("[data-parallax]")];
  const motion = motionAllowed();

  function update() {
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const y = window.scrollY;

    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (!motion) return;

    const parallaxOn = wide.matches;

    if (heroMedia && heroContent) {
      if (y < vh) {
        // Di HP geraknya dibuat setengah dari desktop: scroll sentuhan native dan
        // bilah alamat yang muncul-hilang membuat gerak besar terlihat patah-patah.
        const factor = parallaxOn ? 0.3 : 0.15;
        heroMedia.style.translate = `0 ${y * factor}px`;
        heroContent.style.opacity = String(1 - 0.6 * Math.min(1, y / (vh * 0.6)));
      } else {
        heroMedia.style.translate = "";
        heroContent.style.opacity = "";
      }
    }

    for (const frame of frames) {
      if (!parallaxOn) {
        frame.style.removeProperty("--parallax");
        continue;
      }
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) continue;
      // -1 saat bingkai baru masuk dari bawah, 1 saat keluar di atas.
      const p = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2);
      frame.style.setProperty("--parallax", `${(p * 6).toFixed(2)}%`);
    }
  }

  if (lenis) {
    lenis.on("scroll", update);
  } else {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          update();
        });
      },
      { passive: true },
    );
  }
  window.addEventListener("resize", update);
  update();
}

// Penanda peta muncul bergiliran: Coban Rondo, Gunung Bromo, lalu Malang yang berdenyut.
export function animateMapMarkers(container) {
  const markers = [...container.querySelectorAll(".map-marker")];
  const main = container.querySelector(".map-marker--main");

  if (!motionAllowed() || !("IntersectionObserver" in window)) return;

  markers.forEach((marker) => marker.classList.add("is-waiting"));
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      markers.forEach((marker) => marker.classList.remove("is-waiting"));
      setTimeout(() => main?.classList.add("is-pulsing"), 900);
    },
    { threshold: 0.4 },
  );
  observer.observe(container);
}
