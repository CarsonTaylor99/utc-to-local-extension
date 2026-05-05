// ===== Helpers =====

/**
 * Parse time strings:
 * - H:MM
 * - HH:MM
 * - H:MM:SS
 * - HH:MM:SS
 * Minutes must be 2 digits (so "1:3" is invalid; "1:03" is valid).
 */
function parseTime24(str) {
  const s = String(str || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return { ok: false, err: "Time must look like 1:30, 13:05, or 23:59:45." };

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = m[3] == null ? 0 : Number(m[3]);

  if (!Number.isFinite(hh) || !Number.isFinite(mm) || !Number.isFinite(ss)) {
    return { ok: false, err: "Time contains invalid numbers." };
  }
  if (hh < 0 || hh > 23) return { ok: false, err: "Hour must be 0–23." };
  if (mm < 0 || mm > 59) return { ok: false, err: "Minutes must be 00–59." };
  if (ss < 0 || ss > 59) return { ok: false, err: "Seconds must be 00–59." };

  return { ok: true, hh, mm, ss };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Given an offset in minutes (e.g., UTC+8 => 480),
 * return the "current date" in that offset zone (YYYY-MM-DD),
 * computed from UTC time (not your local clock).
 */
function currentDateInOffset(offsetMinutes) {
  const now = Date.now();
  const shifted = new Date(now + offsetMinutes * 60_000);

  // Use UTC getters because we manually shifted the timestamp
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/**
 * Create a UTC timestamp (ms) from a date (YYYY-MM-DD), time parts,
 * and an offset (minutes). The input represents local time in that offset zone.
 */
function utcMillisFromOffsetLocal(dateStr, hh, mm, ss, offsetMinutes) {
  const [Y, M, D] = dateStr.split("-").map(Number);
  const naiveUtc = Date.UTC(Y, M - 1, D, hh, mm, ss); // treat as if it's UTC
  // But it's actually in UTC±offset, so convert to real UTC:
  return naiveUtc - offsetMinutes * 60_000;
}

function formatLocal12h(date) {
  // Uses your system local timezone automatically
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(date);
}

function formatLocalMeta(date) {
  const datePart = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);

  const tzName = Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value;

  return tzName ? `${datePart} • ${tzName}` : datePart;
}

function offsetLabel(hours) {
  // show as UTC+8 (not UTC+8:00)
  if (hours === 0) return "UTC+0";
  return hours > 0 ? `UTC+${hours}` : `UTC${hours}`;
}

function isLocalDstNow() {
  // Simple DST detection: compare offset now vs offset in winter (Jan) or summer (Jul)
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const offNow = now.getTimezoneOffset();
  const offJan = jan.getTimezoneOffset();
  const offJul = jul.getTimezoneOffset();
  const standard = Math.max(offJan, offJul); // larger minutes = more west = "standard"
  return offNow < standard;
}

// ===== Data for reference panel =====

const UTC_REFERENCE = [
  { name: "Japan", offset: +9, note: "JST (no DST). Tokyo, Osaka, Sapporo." },
  { name: "South Korea", offset: +9, note: "KST (no DST). Seoul." },
  { name: "China", offset: +8, note: "China Standard Time. Beijing, Shanghai." },
  { name: "Singapore", offset: +8, note: "No DST." },
  { name: "Taiwan", offset: +8, note: "No DST." },
  { name: "Hong Kong", offset: +8, note: "No DST." },
  { name: "Philippines", offset: +8, note: "No DST." },
  { name: "Western Australia (Perth)", offset: +8, note: "No DST in WA." },
  { name: "Thailand", offset: +7, note: "Bangkok. No DST." },
  { name: "Vietnam", offset: +7, note: "Hanoi, Ho Chi Minh City. No DST." },
  { name: "Indonesia (Jakarta)", offset: +7, note: "WIB (No DST)." },
  { name: "India", offset: +5.5, note: "IST (UTC+5:30). No DST." },
  { name: "Nepal", offset: +5.75, note: "NPT (UTC+5:45). No DST." },
  { name: "UAE (Dubai)", offset: +4, note: "GST. No DST." },
  { name: "Turkey", offset: +3, note: "Permanent UTC+3." },
  { name: "Greece / Finland", offset: +2, note: "EET / EEST (DST varies seasonally)." },
  { name: "Germany / France / Italy", offset: +1, note: "CET / CEST (DST varies seasonally)." },
  { name: "United Kingdom", offset: 0, note: "GMT / BST (DST varies seasonally)." },
  { name: "Portugal (Lisbon)", offset: 0, note: "WET / WEST (DST varies seasonally)." },
  { name: "Brazil (São Paulo)", offset: -3, note: "BRT (DST generally not used now)." },
  { name: "Argentina", offset: -3, note: "ART (no DST typically)." },
  { name: "New York / Toronto", offset: -5, note: "ET: EST/EDT (DST varies seasonally)." },
  { name: "Chicago", offset: -6, note: "CT: CST/CDT (DST varies seasonally)." },
  { name: "Denver", offset: -7, note: "MT: MST/MDT (DST varies seasonally)." },
  { name: "Los Angeles / Vancouver", offset: -8, note: "PT: PST/PDT (DST varies seasonally)." },
  { name: "Alaska", offset: -9, note: "AKST/AKDT (DST varies seasonally)." },
  { name: "Hawaii", offset: -10, note: "HST (no DST)." }
];

// ===== UI Wiring =====

const els = {
  offsetSelect: document.getElementById("offsetSelect"),
  timeInput: document.getElementById("timeInput"),
  dateInput: document.getElementById("dateInput"),
  outputTime: document.getElementById("outputTime"),
  outputMeta: document.getElementById("outputMeta"),
  errorBox: document.getElementById("errorBox"),
  localTzPill: document.getElementById("localTzPill"),
  dstPill: document.getElementById("dstPill"),
  toggleRef: document.getElementById("toggleRef"),
  closeRef: document.getElementById("closeRef"),
  refPanel: document.getElementById("refPanel"),
  refSearch: document.getElementById("refSearch"),
  refList: document.getElementById("refList")
};

function buildOffsetOptions() {
  // Use integer hours in dropdown to match your "UTC+8" style (no :00).
  // (You can expand to half-hour offsets later if you want.)
  const hours = [];
  for (let h = -12; h <= 14; h++) hours.push(h);

  for (const h of hours) {
    const opt = document.createElement("option");
    opt.value = String(h);
    opt.textContent = offsetLabel(h);
    if (h === 0) opt.textContent = "UTC+0";
    els.offsetSelect.appendChild(opt);
  }

  // Default to UTC+0
  els.offsetSelect.value = "0";
}

function setFooterInfo() {
  const tzName =
    Intl.DateTimeFormat(undefined, { timeZoneName: "long" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value || "Local Time";

  els.localTzPill.textContent = `Local: ${tzName}`;
  els.dstPill.textContent = `DST: ${isLocalDstNow() ? "On" : "Off"}`;
}

function showError(msg) {
  els.errorBox.textContent = msg || "";
}

function updateConversion() {
  showError("");

  const hourOffset = Number(els.offsetSelect.value);
  if (!Number.isFinite(hourOffset)) {
    showError("Invalid offset selection.");
    return;
  }

  const offsetMinutes = hourOffset * 60;

  const timeRaw = els.timeInput.value;
  if (!timeRaw.trim()) {
    els.outputTime.textContent = "—";
    els.outputMeta.textContent = "Enter a time to convert.";
    return;
  }

  const parsed = parseTime24(timeRaw);
  if (!parsed.ok) {
    els.outputTime.textContent = "—";
    els.outputMeta.textContent = "Fix the input and try again.";
    showError(parsed.err);
    return;
  }

  // Date: if blank, use the current date in that offset zone
  const dateStr = els.dateInput.value || currentDateInOffset(offsetMinutes);

  const utcMs = utcMillisFromOffsetLocal(dateStr, parsed.hh, parsed.mm, parsed.ss, offsetMinutes);
  const localDate = new Date(utcMs);

  els.outputTime.textContent = formatLocal12h(localDate);

  const inputPretty = `${offsetLabel(hourOffset)} • ${dateStr} • ${pad2(parsed.hh)}:${pad2(
    parsed.mm
  )}:${pad2(parsed.ss)}`;
  els.outputMeta.textContent = `${inputPretty} → ${formatLocalMeta(localDate)}`;
}

function openRefPanel() {
  els.refPanel.classList.add("open");
  els.refPanel.setAttribute("aria-hidden", "false");
  els.toggleRef.setAttribute("aria-expanded", "true");
  setTimeout(() => els.refSearch.focus(), 50);
}

function closeRefPanel() {
  els.refPanel.classList.remove("open");
  els.refPanel.setAttribute("aria-hidden", "true");
  els.toggleRef.setAttribute("aria-expanded", "false");
}

function renderRefList(filterText = "") {
  const q = filterText.trim().toLowerCase();
  els.refList.innerHTML = "";

  const items = UTC_REFERENCE.filter((x) => {
    if (!q) return true;
    return (
      x.name.toLowerCase().includes(q) ||
      String(x.offset).toLowerCase().includes(q) ||
      (x.note || "").toLowerCase().includes(q) ||
      offsetLabel(x.offset).toLowerCase().includes(q)
    );
  });

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "ref-item";
    empty.innerHTML = `<div class="ref-name">No matches</div><div class="ref-note">Try “Japan”, “UK”, “India”, “UTC+8”, etc.</div>`;
    els.refList.appendChild(empty);
    return;
  }

  for (const it of items) {
    const div = document.createElement("div");
    div.className = "ref-item";
    div.setAttribute("role", "listitem");

    const off = offsetLabel(it.offset);

    div.innerHTML = `
      <div class="ref-item-top">
        <div class="ref-name">${it.name}</div>
        <div class="ref-offset">${off}</div>
      </div>
      <div class="ref-note">${it.note || ""}</div>
    `;

    // Click-to-use: set dropdown to the matching integer offset if it is integer
    // (For half offsets like India +5.5, we just don't set dropdown here)
    div.addEventListener("click", () => {
      if (Number.isInteger(it.offset)) {
        els.offsetSelect.value = String(it.offset);
        updateConversion();
        closeRefPanel();
      }
    });

    els.refList.appendChild(div);
  }
}

function init() {
  buildOffsetOptions();
  setFooterInfo();
  renderRefList("");

  els.offsetSelect.addEventListener("change", updateConversion);
  els.timeInput.addEventListener("input", updateConversion);
  els.dateInput.addEventListener("change", updateConversion);

  els.toggleRef.addEventListener("click", () => {
    const isOpen = els.refPanel.classList.contains("open");
    if (isOpen) closeRefPanel();
    else openRefPanel();
  });

  els.closeRef.addEventListener("click", closeRefPanel);

  els.refSearch.addEventListener("input", () => {
    renderRefList(els.refSearch.value);
  });

  // Escape closes the panel
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.refPanel.classList.contains("open")) {
      closeRefPanel();
    }
  });

  updateConversion();
}

init();
