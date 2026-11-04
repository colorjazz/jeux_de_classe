(() => {
  const S = window.SITE;
  const ALL = "Tous";
  const $ = (sel) => document.querySelector(sel);
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ---------- Basic text bindings ---------- */
  document.title = `${S.name} — ${S.role}`;
  document.querySelectorAll("[data-bind]").forEach((el) => {
    el.textContent = S[el.dataset.bind] ?? "";
  });
  $(".hero__badge").hidden = !S.available;
  $("#year").textContent = new Date().getFullYear();

  $("#stats").innerHTML = (S.stats || [])
    .map((s) => `<li><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`)
    .join("");

  $("#about-text").innerHTML = (S.about || []).map((p) => `<p>${esc(p)}</p>`).join("");
  $("#skills").innerHTML = (S.skills || [])
    .map((g) => `<div><h3>${esc(g.title)}</h3><ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`)
    .join("");

  const email = $("#email-link");
  email.href = `mailto:${S.email}`;
  email.textContent = S.email;
  $("#socials").innerHTML = (S.socials || [])
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`)
    .join("");

  /* ---------- Projects ---------- */
  const projects = (S.projects || []).map((p, i) => ({ ...p, id: i }));

  const initials = (t) => {
    const words = t.split(/[\s-]+/).filter((w) => /^\p{Lu}/u.test(w));
    return words.length > 1 ? words.map((w) => w[0]).join("").slice(0, 3) : t.slice(0, 2);
  };

  const cover = (p) =>
    p.image
      ? `<img src="${esc(p.image)}" alt="" loading="lazy" />`
      : `<div class="art" style="--c:${esc(p.accent || "#e4572e")}"><span class="art__label">${esc(initials(p.title)
        )}</span></div>`;

  const card = (p) => `
    <button class="card reveal ${p.featured ? "card--featured" : ""}" data-id="${p.id}" type="button">
      <div class="card__cover">${cover(p)}</div>
      <div class="card__body">
        ${p.role || p.year ? `<div class="card__meta"><span>${esc(p.role || "")}</span><span>${esc(p.year || "")}</span></div>` : ""}
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary)}</p>
        <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      </div>
    </button>`;

  const grid = $("#projects");
  const render = (filter) => {
    const list = filter === ALL ? projects : projects.filter((p) => (p.tags || []).includes(filter));
    grid.innerHTML = list.map(card).join("");
    observe();
  };

  const tags = [ALL, ...new Set(projects.flatMap((p) => p.tags || []))];
  const filters = $("#filters");
  filters.innerHTML = tags
    .map((t, i) => `<button type="button" aria-pressed="${i === 0}" data-tag="${esc(t)}">${esc(t)}</button>`)
    .join("");
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b === btn));
    render(btn.dataset.tag);
  });

  /* ---------- Modal ---------- */
  const modal = $("#modal");
  grid.addEventListener("click", (e) => {
    const c = e.target.closest(".card");
    if (!c) return;
    const p = projects[c.dataset.id];
    $("#modal-body").innerHTML = `
      <div class="card__cover">${cover(p)}</div>
      <div class="modal__content">
        <div class="card__meta"><span>${esc((p.tags || []).join(" · "))}</span><span>${esc(p.year || "")}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description || p.summary)}</p>
        ${p.role ? `<p class="modal__role"><strong>Mon rôle&nbsp;:</strong> ${esc(p.role)}</p>` : ""}
        ${
          p.links && p.links.length
            ? `<div class="modal__links">${p.links
                .map(
                  (l, i) =>
                    `<a class="btn ${i === 0 ? "btn--primary" : ""}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`
                )
                .join("")}</div>`
            : ""
        }
      </div>`;
    modal.showModal();
  });
  $(".modal__close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  /* ---------- Reveal on scroll ---------- */
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((en) => {
              if (en.isIntersecting) {
                en.target.classList.add("is-visible");
                io.unobserve(en.target);
              }
            }),
          { threshold: 0.1 }
        )
      : null;
  function observe() {
    grid.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("is-visible")));
  }

  render(ALL);

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch {}
  $(".theme-toggle").addEventListener("click", () => {
    const dark =
      root.dataset.theme === "dark" ||
      (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme = dark ? "light" : "dark";
    try {
      localStorage.setItem("theme", root.dataset.theme);
    } catch {}
  });
})();
