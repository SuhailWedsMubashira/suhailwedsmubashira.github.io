const EVENT = {
  title: "Nikah of Mohammed Suhail & Dr. Mubashira Ahmed",
  startsAt: new Date("2027-01-03T11:00:00+05:30"),
  startUtc: "20270103T053000Z",
  endUtc: "20270103T083000Z",
  location: "Palemar Convention Centre, Mary Hill, Konchady, Mangalore",
  details: "Nikah at 11:00 AM, followed by lunch till 2:00 PM.",
  // Digits only, with country code (e.g. "919876543210"). Empty lets the guest pick a chat.
  rsvpPhone: "",
  rsvpText: "Assalamu Alaikum! Insha'Allah I will attend the Nikah of Suhail & Mubashira on 3 January 2027.",
};

const byId = (id) => document.getElementById(id);

function openCover() {
  const cover = byId("cover");
  if (!cover || cover.classList.contains("open")) return;
  cover.classList.add("open");
  const delay = cover.classList.contains("instant") ? 0 : Number(cover.dataset.openDelay || 0);
  setTimeout(() => {
    document.body.classList.remove("locked");
    document.dispatchEvent(new Event("invite:open"));
  }, delay);
}

function addToCalendar() {
  if (!/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) {
    const params = new URLSearchParams({
      action: "TEMPLATE", text: EVENT.title, dates: `${EVENT.startUtc}/${EVENT.endUtc}`,
      details: EVENT.details, location: EVENT.location,
    });
    window.open(`https://calendar.google.com/calendar/render?${params}`, "_blank", "noopener");
    return;
  }
  const esc = (s) => s.replace(/[,;\\]/g, (c) => "\\" + c);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Suhail & Mubashira//Nikah//EN", "BEGIN:VEVENT",
    "UID:nikah-20270103-suhail-mubashira", `DTSTAMP:${EVENT.startUtc}`,
    `DTSTART:${EVENT.startUtc}`, `DTEND:${EVENT.endUtc}`,
    `SUMMARY:${esc(EVENT.title)}`, `LOCATION:${esc(EVENT.location)}`, `DESCRIPTION:${esc(EVENT.details)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([ics], { type: "text/calendar" })),
    download: "nikah-suhail-mubashira.ics",
  });
  a.click();
}

function startCountdown() {
  const box = byId("countdown");
  if (!box) return;
  const cells = Object.fromEntries([...box.querySelectorAll("[data-u]")].map((el) => [el.dataset.u, el]));
  const pad = (n) => String(n).padStart(2, "0");
  const set = (el, value) => {
    const text = String(value);
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  };
  const tick = () => {
    const ms = EVENT.startsAt - Date.now();
    if (ms <= 0) {
      box.outerHTML = '<p class="cd-done">Alhamdulillah — the blessed day is here.</p>';
      clearInterval(timer);
      return;
    }
    const s = Math.floor(ms / 1000);
    set(cells.d, Math.floor(s / 86400));
    set(cells.h, pad(Math.floor(s / 3600) % 24));
    set(cells.m, pad(Math.floor(s / 60) % 60));
    set(cells.s, pad(s % 60));
  };
  const timer = setInterval(tick, 1000);
  tick();
}

function revealOnScroll() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
}

const cover = byId("cover");
if (cover) {
  cover.addEventListener("click", openCover);
  cover.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") openCover(); });
  if (location.hash === "#open") {
    cover.classList.add("instant");
    openCover();
  }
}

const mapLink = byId("map");
if (mapLink) mapLink.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(EVENT.location);

const rsvpLink = byId("rsvp");
if (rsvpLink) rsvpLink.href = `https://wa.me/${EVENT.rsvpPhone}?text=${encodeURIComponent(EVENT.rsvpText)}`;

byId("calendar")?.addEventListener("click", addToCalendar);
startCountdown();
if (document.body.classList.contains("locked")) {
  document.addEventListener("invite:open", revealOnScroll, { once: true });
} else {
  revealOnScroll();
}
