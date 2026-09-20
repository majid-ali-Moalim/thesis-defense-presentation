(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const progress = document.getElementById("progressBar");
  const counter = document.getElementById("slideCounter");
  const toc = document.getElementById("toc");
  const notes = document.getElementById("speakerNotes");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const flowDetail = document.getElementById("flowDetail");
  const timerEl = document.getElementById("timer");
  let index = 0;
  let start = Date.now();
  let notesOn = false;

  const flowCopy = {
    1: {
      t: "1. Call / request",
      d: "Scenario: traffic accident near Taleex, Hodan. The public submits Request Ambulance, or the 999 desk takes the call. Source is PHONE_CALL, WEBSITE, WALK_IN, STAFF, REFERRAL or OTHER. The paper book is no longer the first record.",
    },
    2: {
      t: "2. Log the case",
      d: "EADS creates EmergencyRequest with tracking code CASE-YYYY-####. Pickup is captured as region, district, landmark, and free-text address — not GPS. Patient details and incident category are stored so the case can be searched later.",
    },
    3: {
      t: "3. Triage",
      d: "The case sits in PENDING / REVIEWING. The dispatcher sets priority LOW, MEDIUM, HIGH or CRITICAL, confirms district coverage, and chooses a destination hospital as a directory record. Notifications already show the new HIGH case.",
    },
    4: {
      t: "4. Manual assignment",
      d: "Dispatcher assigns the covering station, an available ambulance, a driver, and a nurse. Assignment is never automatic. Busy units are excluded. If Hodan is out of coverage, a station transfer is logged with a reason.",
    },
    5: {
      t: "5. Field response",
      d: "The driver opens Active Case, accepts the mission, and taps status until the job is done. Each tap writes a case log and updates dispatch and public tracking — even if the radio fails.",
    },
    6: {
      t: "6. On-scene care",
      d: "The nurse opens Active Case: assessment, vitals, pain scale, medical notes, then Load patient. Notes update in place. The driver does not start hospital transport until the nurse has loaded the patient.",
    },
    7: {
      t: "7. Transport & handover",
      d: "The crew takes the patient to hospital. The dispatcher phones Shaafi Hospital (hospitals are not system users) and records accept or refuse on the case. The nurse completes handover: living/deceased, destination, clinical summary.",
    },
    8: {
      t: "8. Close & evidence",
      d: "The case is COMPLETED (or CANCELLED with a reason). Response and service minutes are stored. Operations, station, and handover reports can be exported to PDF/Excel. The activity log remains searchable — the resource Aamin did not have on paper.",
    },
  };

  function show(i, hash = true) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("active", n === index));
    const pct = ((index + 1) / slides.length) * 100;
    if (progress) progress.style.width = pct + "%";
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
    if (hash) history.replaceState(null, "", `#${index + 1}`);
    animateBars();
    animateStats();
    syncPicker();
    const note = slides[index].dataset.notes || "";
    if (notes) notes.textContent = note ? `Speaker note: ${note}` : "Speaker note: use this slide to walk the panel through evidence, then invite a question.";
  }

  function animateBars() {
    document.querySelectorAll(".slide.active .bar > i").forEach((el) => {
      const w = el.dataset.w || "0";
      requestAnimationFrame(() => {
        el.style.width = w + "%";
      });
    });
  }

  function animateStats() {
    document.querySelectorAll(".slide.active [data-count]").forEach((el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const startVal = 0;
      const t0 = performance.now();
      const dur = 700;
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(startVal + (target - startVal) * p) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function buildPicker() {
    const select = document.getElementById("slideSelect");
    const dots = document.getElementById("slideDots");
    if (select) {
      select.innerHTML = slides
        .map((s, i) => {
          const n = String(i + 1).padStart(2, "0");
          const title = s.dataset.title || `Slide ${i + 1}`;
          return `<option value="${i}">${n} · ${title}</option>`;
        })
        .join("");
      select.addEventListener("change", () => show(Number(select.value)));
    }
    if (dots) {
      dots.innerHTML = slides
        .map((s, i) => {
          const title = s.dataset.title || `Slide ${i + 1}`;
          return `<button type="button" class="slide-dot" data-goto="${i}" title="${title}">${i + 1}</button>`;
        })
        .join("");
    }
  }

  function syncPicker() {
    const select = document.getElementById("slideSelect");
    if (select && Number(select.value) !== index) select.value = String(index);
    document.querySelectorAll(".slide-dot").forEach((btn) => {
      btn.classList.toggle("on", Number(btn.dataset.goto) === index);
    });
  }

  function buildToc() {
    const grid = document.getElementById("tocGrid");
    if (!grid) return;
    grid.innerHTML = slides
      .map((s, i) => {
        const title = s.dataset.title || `Slide ${i + 1}`;
        const n = String(i + 1).padStart(2, "0");
        return `<a href="#${i + 1}" data-goto="${i}"><small>${n}</small>${title}</a>`;
      })
      .join("");
    grid.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      e.preventDefault();
      toc.classList.remove("open");
      show(Number(a.dataset.goto));
    });
  }

  document.getElementById("nextBtn")?.addEventListener("click", () => show(index + 1));
  document.getElementById("prevBtn")?.addEventListener("click", () => show(index - 1));
  document.getElementById("tocBtn")?.addEventListener("click", () => toc.classList.toggle("open"));
  document.getElementById("closeToc")?.addEventListener("click", () => toc.classList.remove("open"));
  document.getElementById("fsBtn")?.addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });
  document.getElementById("notesBtn")?.addEventListener("click", () => {
    notesOn = !notesOn;
    notes?.classList.toggle("show", notesOn);
  });

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) {
      e.preventDefault();
      show(index + 1);
    } else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) {
      e.preventDefault();
      show(index - 1);
    } else if (e.key === "Home") show(0);
    else if (e.key === "End") show(slides.length - 1);
    else if (e.key.toLowerCase() === "o") toc.classList.toggle("open");
    else if (e.key.toLowerCase() === "f") document.getElementById("fsBtn")?.click();
    else if (e.key.toLowerCase() === "n") document.getElementById("notesBtn")?.click();
    else if (e.key === "Escape") {
      toc.classList.remove("open");
      lightbox.classList.remove("open");
    }
  });

  let tx = 0;
  document.addEventListener("touchstart", (e) => (tx = e.changedTouches[0].screenX), { passive: true });
  document.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].screenX - tx;
      if (dx < -50) show(index + 1);
      if (dx > 50) show(index - 1);
    },
    { passive: true }
  );

  document.querySelectorAll(".shot, .zoomable").forEach((el) => {
    el.addEventListener("click", () => {
      const img = el.querySelector("img") || el;
      if (img && img.src) {
        lightboxImg.src = img.src;
        lightbox.classList.add("open");
      }
    });
  });
  lightbox?.addEventListener("click", () => lightbox.classList.remove("open"));

  document.querySelectorAll(".flow-step").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".flow-step").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      const id = btn.dataset.step;
      const item = flowCopy[id];
      if (item && flowDetail) flowDetail.innerHTML = `<strong>${item.t}</strong><p>${item.d}</p>`;
    });
  });

  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll(".tab")];
    const panels = [...root.querySelectorAll(".panel")];
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("on"));
        panels.forEach((p) => p.classList.remove("on"));
        tab.classList.add("on");
        panels[i]?.classList.add("on");
      });
    });
  });

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-goto]");
    if (!el || el.closest("#tocGrid")) return;
    const n = Number(el.dataset.goto);
    if (Number.isNaN(n)) return;
    e.preventDefault();
    show(n);
  });

  setInterval(() => {
    if (!timerEl) return;
    const s = Math.floor((Date.now() - start) / 1000);
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const r = String(s % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${r}`;
  }, 1000);

  buildToc();
  buildPicker();
  const fromHash = Number((location.hash || "#1").replace("#", "")) - 1;
  show(Number.isNaN(fromHash) ? 0 : fromHash, false);
  window.addEventListener("hashchange", () => {
    const n = Number((location.hash || "#1").replace("#", "")) - 1;
    if (!Number.isNaN(n)) show(n, false);
  });
})();
