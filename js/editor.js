/* ============================================================
   Editor visual — genera el formulario desde un esquema,
   guarda borradores en localStorage y previsualiza en vivo.
   ============================================================ */
(function () {
  const DRAFT_KEY = "on-site-draft";
  const DEFAULTS = JSON.parse(JSON.stringify(window.SITE_CONFIG));

  /* ---------- estado ---------- */
  function deepMerge(base, extra) {
    if (Array.isArray(extra)) return extra.slice();
    if (extra && typeof extra === "object") {
      const out = Object.assign({}, base);
      Object.keys(extra).forEach((k) => { out[k] = deepMerge(base ? base[k] : undefined, extra[k]); });
      return out;
    }
    return extra === undefined ? base : extra;
  }

  let cfg = JSON.parse(JSON.stringify(DEFAULTS));
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) cfg = deepMerge(cfg, JSON.parse(draft));
  } catch (e) { /* sin almacenamiento disponible */ }

  const getPath = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), cfg);
  function setPath(path, value) {
    const keys = path.split(".");
    let o = cfg;
    keys.slice(0, -1).forEach((k) => { o = o[k]; });
    o[keys[keys.length - 1]] = value;
  }

  const draftState = document.getElementById("draftState");
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(cfg));
      draftState.textContent = "Borrador guardado en este navegador · " +
        new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      draftState.textContent = "⚠ Borrador demasiado grande para guardarse: usa URLs o sube las imágenes a la carpeta img/ del repositorio.";
    }
  }

  /* ---------- vista previa ---------- */
  const frame = document.getElementById("previewFrame");
  let reloadTimer = null;
  function scheduleReload() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => { frame.contentWindow.location.reload(); }, 700);
  }
  function pushTheme() {
    try { frame.contentWindow.postMessage({ type: "cfg-theme", theme: cfg.theme }, "*"); } catch (e) {}
  }

  /* ---------- esquema del formulario ---------- */
  // tipos: text, textarea, color, toggle, range, list (un elemento por línea)
  // live:true => se aplica sin recargar (solo tema)
  const SCHEMA = [
    { title: "Tema y ajustes", fields: [
      { path: "theme.ink", label: "Color de fondo", type: "color", live: true },
      { path: "theme.bone", label: "Color del texto", type: "color", live: true },
      { path: "theme.acid", label: "Color de acento", type: "color", live: true },
      { path: "theme.ember", label: "Color secundario", type: "color", live: true },
      { path: "theme.shader", label: "Fondo animado (WebGL) en el hero", type: "toggle" },
      { path: "theme.grain", label: "Textura de grano en el hero", type: "toggle", live: true },
      { path: "theme.smoothScroll", label: "Scroll suave", type: "toggle" },
      { path: "theme.preloader", label: "Pantalla de carga inicial", type: "toggle" },
      { path: "theme.marqueeSpeed", label: "Velocidad de la marquesina (segundos por ciclo, menos = más rápido)", type: "range", min: 6, max: 40 },
    ]},
    { title: "Cabecera", fields: [
      { path: "header.logo", label: "Logotipo (iniciales)", type: "text" },
      { path: "header.location", label: "Ciudad junto al reloj", type: "text" },
    ]},
    { title: "Portada (hero)", fields: [
      { path: "hero.line1", label: "Titular — línea 1", type: "text" },
      { path: "hero.line2", label: "Titular — línea 2 (en acento)", type: "text" },
      { path: "hero.role", label: "Rol (arriba izquierda)", type: "textarea" },
      { path: "hero.avail", label: "Disponibilidad (arriba derecha)", type: "textarea" },
      { path: "hero.badge", label: "Insignia", type: "text" },
      { path: "hero.tag", label: "Frase inferior", type: "textarea" },
      { path: "hero.scroll", label: "Texto del botón de scroll", type: "text" },
    ]},
    { title: "Marquesina", fields: [
      { path: "marquee", label: "Conceptos (uno por línea)", type: "list" },
    ]},
    { title: "Sobre mí", fields: [
      { path: "about.label", label: "Título de sección", type: "text" },
      { path: "about.statement", label: "Declaración grande", type: "textarea" },
      { path: "about.p1", label: "Párrafo 1", type: "textarea" },
      { path: "about.p2", label: "Párrafo 2", type: "textarea" },
      { sub: "Estadísticas" },
      { path: "about.stats.0.n", label: "Dato 1 — número", type: "number" },
      { path: "about.stats.0.label", label: "Dato 1 — etiqueta", type: "text" },
      { path: "about.stats.1.n", label: "Dato 2 — número", type: "number" },
      { path: "about.stats.1.label", label: "Dato 2 — etiqueta", type: "text" },
      { path: "about.stats.2.n", label: "Dato 3 — número", type: "number" },
      { path: "about.stats.2.label", label: "Dato 3 — etiqueta", type: "text" },
    ]},
    { title: "Trabajos (lista)", fields: (() => {
      const f = [
        { path: "work.label", label: "Título de sección", type: "text" },
        { path: "work.years", label: "Rango de años", type: "text" },
      ];
      for (let i = 0; i < 5; i++) {
        f.push({ sub: `Trabajo ${String(i + 1).padStart(3, "0")}` });
        f.push({ path: `work.items.${i}.name`, label: "Nombre", type: "text" });
        f.push({ path: `work.items.${i}.meta`, label: "Disciplinas", type: "text" });
        f.push({ path: `work.items.${i}.year`, label: "Año", type: "text" });
      }
      return f;
    })() },
    { title: "Servicios", fields: (() => {
      const f = [{ path: "services.label", label: "Título de sección", type: "text" }];
      for (let i = 0; i < 4; i++) {
        f.push({ sub: `Servicio ${"abcd"[i]}.` });
        f.push({ path: `services.items.${i}.title`, label: "Título", type: "text" });
        f.push({ path: `services.items.${i}.body`, label: "Descripción", type: "textarea" });
      }
      return f;
    })() },
    { title: "Contacto y pie", fields: [
      { path: "contact.kicker", label: "Entradilla", type: "textarea" },
      { path: "contact.cta1", label: "CTA — línea 1", type: "text" },
      { path: "contact.cta2", label: "CTA — línea 2 (contorno)", type: "text" },
      { path: "contact.email", label: "Email", type: "text" },
      { path: "contact.socials", label: "Redes (una por línea)", type: "list" },
      { path: "contact.studio", label: "Dirección del estudio", type: "textarea" },
      { path: "contact.copyright", label: "Línea de copyright", type: "text" },
    ]},
  ];

  SCHEMA.push({ title: "Páginas de proyecto — textos comunes", fields: [
    { path: "caseUi.kicker", label: "Etiqueta de cabecera («Case study»)", type: "text" },
    { path: "caseUi.brief", label: "Título de la sección a", type: "text" },
    { path: "caseUi.work", label: "Título de la sección b", type: "text" },
    { path: "caseUi.next", label: "Etiqueta «Next project»", type: "text" },
  ]});

  // grupos por proyecto (páginas de caso)
  const PROJECT_LABELS = {
    "mono-records": "Proyecto — Mono Records",
    "cafe-brut": "Proyecto — Café Brut",
    "ojo-festival": "Proyecto — Ojo Festival",
    "norr-atelier": "Proyecto — Norr Atelier",
    "liminal-type": "Proyecto — Liminal Type Co.",
  };
  Object.keys(PROJECT_LABELS).forEach((slug) => {
    SCHEMA.push({ title: PROJECT_LABELS[slug], page: `project.html?p=${slug}`, fields: [
      { path: `projects.${slug}.title`, label: "Título", type: "text" },
      { path: `projects.${slug}.client`, label: "Cliente", type: "text" },
      { path: `projects.${slug}.year`, label: "Año", type: "text" },
      { path: `projects.${slug}.role`, label: "Rol", type: "text" },
      { path: `projects.${slug}.tags`, label: "Entregables (separados por comas)", type: "text" },
      { path: `projects.${slug}.intro`, label: "Brief (declaración grande)", type: "textarea" },
      { path: `projects.${slug}.body1`, label: "The Work — columna 1", type: "textarea" },
      { path: `projects.${slug}.body2`, label: "The Work — columna 2", type: "textarea" },
      { sub: "Paleta del arte generado" },
      { path: `projects.${slug}.accent`, label: "Acento", type: "color" },
      { path: `projects.${slug}.base`, label: "Base", type: "color" },
      { path: `projects.${slug}.paper`, label: "Papel", type: "color" },
      { path: `projects.${slug}.spec`, label: "Letras del espécimen", type: "text" },
      { sub: "Imágenes — sube un archivo o pega una URL. Vacías, se usa el arte generado." },
      { path: `projects.${slug}.images.hero`, label: "Imagen principal (panorámica)", type: "image" },
      { path: `projects.${slug}.images.art1`, label: "01 · Ancho completo", type: "image" },
      { path: `projects.${slug}.images.a1`, label: "02 · Cuadrada izquierda", type: "image" },
      { path: `projects.${slug}.images.a2`, label: "03 · Cuadrada derecha", type: "image" },
      { path: `projects.${slug}.images.art2`, label: "04 · Ancho completo", type: "image" },
      { path: `projects.${slug}.images.b1`, label: "05 · Cuadrada izquierda", type: "image" },
      { path: `projects.${slug}.images.b2`, label: "06 · Cuadrada derecha", type: "image" },
    ]});
  });

  /* ---------- generación del formulario ---------- */
  const groupsEl = document.getElementById("edGroups");

  function onFieldChange(field) {
    saveDraft();
    if (field.live) pushTheme();
    else scheduleReload();
    if (field.path && field.path.startsWith("projects.")) {
      // salta a la página del proyecto que se está editando
      const slug = field.path.split(".")[1];
      const target = `project.html?p=${slug}`;
      if (!frame.src.endsWith(target)) {
        document.getElementById("pageSelect").value = target;
        frame.src = target;
      }
    }
  }

  function buildField(field) {
    if (field.sub) {
      const h = document.createElement("p");
      h.className = "ed-sub";
      h.textContent = field.sub;
      return h;
    }
    const wrap = document.createElement("div");
    wrap.className = "ed-field" + (field.type === "list" ? " ed-field--list" : "");
    const label = document.createElement("label");
    label.textContent = field.label;
    wrap.appendChild(label);
    const value = getPath(field.path);

    if (field.type === "textarea" || field.type === "list") {
      const ta = document.createElement("textarea");
      ta.value = field.type === "list" ? (value || []).join("\n") : (value ?? "");
      ta.addEventListener("input", () => {
        setPath(field.path, field.type === "list"
          ? ta.value.split("\n").map((s) => s.trim()).filter(Boolean)
          : ta.value);
        onFieldChange(field);
      });
      wrap.appendChild(ta);
    } else if (field.type === "color") {
      const row = document.createElement("div");
      row.className = "ed-color";
      const picker = document.createElement("input");
      picker.type = "color"; picker.value = value || "#000000";
      const text = document.createElement("input");
      text.type = "text"; text.value = value || "";
      const update = (v) => {
        setPath(field.path, v); picker.value = v; text.value = v; onFieldChange(field);
      };
      picker.addEventListener("input", () => update(picker.value));
      text.addEventListener("change", () => {
        if (/^#[0-9a-f]{6}$/i.test(text.value.trim())) update(text.value.trim());
      });
      row.appendChild(picker); row.appendChild(text);
      wrap.appendChild(row);
    } else if (field.type === "toggle") {
      wrap.className = "ed-field";
      const row = document.createElement("div");
      row.className = "ed-toggle";
      const span = document.createElement("span");
      span.textContent = field.label;
      label.remove();
      const sw = document.createElement("label");
      sw.className = "ed-switch";
      const input = document.createElement("input");
      input.type = "checkbox"; input.checked = value !== false;
      const knob = document.createElement("i");
      input.addEventListener("change", () => { setPath(field.path, input.checked); onFieldChange(field); });
      sw.appendChild(input); sw.appendChild(knob);
      row.appendChild(span); row.appendChild(sw);
      wrap.appendChild(row);
    } else if (field.type === "range") {
      const row = document.createElement("div");
      row.className = "ed-range";
      const input = document.createElement("input");
      input.type = "range"; input.min = field.min; input.max = field.max; input.value = value ?? field.min;
      const out = document.createElement("output");
      out.textContent = input.value + "s";
      input.addEventListener("input", () => {
        out.textContent = input.value + "s";
        setPath(field.path, Number(input.value));
        onFieldChange(field);
      });
      row.appendChild(input); row.appendChild(out);
      wrap.appendChild(row);
    } else if (field.type === "image") {
      if (getPath(field.path) == null) setPath(field.path, { src: "", caption: "" });
      const row = document.createElement("div");
      row.className = "ed-img";
      const thumb = document.createElement("div");
      thumb.className = "ed-img__thumb";
      const fileBtn = document.createElement("label");
      fileBtn.className = "ed-btn ed-img__btn";
      fileBtn.textContent = "Subir…";
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.hidden = true;
      fileBtn.appendChild(fileInput);
      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "ed-btn ed-img__btn ed-btn--danger";
      clearBtn.textContent = "Quitar";
      const urlInput = document.createElement("input");
      urlInput.type = "text";
      const capInput = document.createElement("input");
      capInput.type = "text";
      capInput.placeholder = "Pie de foto (vacío = sin pie)";
      capInput.value = getPath(field.path + ".caption") ?? "";

      const refresh = () => {
        const src = getPath(field.path + ".src") || "";
        thumb.style.backgroundImage = src ? `url("${src}")` : "none";
        clearBtn.style.display = src ? "" : "none";
        urlInput.value = src && !src.startsWith("data:") ? src : "";
        urlInput.placeholder = src.startsWith("data:") ? "(archivo subido)" : "https://… o img/foto.jpg";
      };
      const apply = (src) => { setPath(field.path + ".src", src); refresh(); onFieldChange(field); };

      fileInput.addEventListener("change", () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
          const max = 1600;
          let w = img.naturalWidth, h = img.naturalHeight;
          if (w > max) { h = Math.round(h * (max / w)); w = max; }
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(img.src);
          apply(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = URL.createObjectURL(file);
        fileInput.value = "";
      });
      urlInput.addEventListener("change", () => apply(urlInput.value.trim()));
      clearBtn.addEventListener("click", () => apply(""));
      capInput.addEventListener("input", () => {
        setPath(field.path + ".caption", capInput.value);
        onFieldChange(field);
      });

      row.appendChild(thumb); row.appendChild(fileBtn); row.appendChild(clearBtn);
      wrap.appendChild(row);
      wrap.appendChild(urlInput);
      wrap.appendChild(capInput);
      refresh();
    } else { // text / number
      const input = document.createElement("input");
      input.type = field.type === "number" ? "number" : "text";
      input.value = value ?? "";
      input.addEventListener("input", () => {
        setPath(field.path, field.type === "number" ? Number(input.value) : input.value);
        onFieldChange(field);
      });
      wrap.appendChild(input);
    }
    return wrap;
  }

  SCHEMA.forEach((group, gi) => {
    const g = document.createElement("section");
    g.className = "ed-group" + (gi === 0 ? " is-open" : "");
    const head = document.createElement("button");
    head.className = "ed-group__head";
    head.type = "button";
    head.textContent = group.title;
    head.addEventListener("click", () => g.classList.toggle("is-open"));
    const body = document.createElement("div");
    body.className = "ed-group__body";
    group.fields.forEach((f) => body.appendChild(buildField(f)));
    g.appendChild(head); g.appendChild(body);
    groupsEl.appendChild(g);
  });

  /* ---------- barra de la vista previa ---------- */
  document.getElementById("pageSelect").addEventListener("change", (e) => { frame.src = e.target.value; });
  document.getElementById("btnReload").addEventListener("click", () => frame.contentWindow.location.reload());
  const frameWrap = document.getElementById("frameWrap");
  document.querySelectorAll(".ed-dev").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ed-dev").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      frameWrap.classList.toggle("is-mobile", btn.dataset.w === "390");
    });
  });

  /* ---------- acciones ---------- */
  function downloadConfig() {
    const banner = "// ============================================================\n" +
      "// Site configuration — edited visually via editor.html\n" +
      "// Sube este archivo a la carpeta data/ del repositorio para publicar.\n" +
      "// ============================================================\n";
    const body = "window.SITE_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
    const blob = new Blob([banner + body], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "site-config.js";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  document.getElementById("btnDownload").addEventListener("click", downloadConfig);
  document.getElementById("btnDownload2").addEventListener("click", downloadConfig);

  document.getElementById("btnReset").addEventListener("click", () => {
    if (!confirm("¿Descartar el borrador y volver a la configuración publicada?")) return;
    localStorage.removeItem(DRAFT_KEY);
    location.reload();
  });

  const modal = document.getElementById("publishModal");
  document.getElementById("btnPublish").addEventListener("click", () => { modal.hidden = false; });
  document.getElementById("btnCloseModal").addEventListener("click", () => { modal.hidden = true; });
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });

  // estado inicial del borrador
  if (localStorage.getItem(DRAFT_KEY)) {
    draftState.textContent = "Hay un borrador guardado en este navegador.";
  }
})();
