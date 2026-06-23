'use strict';
// ─────────────────────────────────────────────────────────────
//  Bridge to the website's single source of truth (../trip-data.js).
//  trip-data.js is browser code: `window.TRIP = (function(){…})()`.
//  We shim a `window` so we can require it in Node and read the exact
//  same itinerary the hub and map render — edit trip facts in ONE place.
// ─────────────────────────────────────────────────────────────

const TRIP_DATA = require.resolve('../trip-data.js');

// Reload from disk each call (cache-busted) so a `git pull` is picked up
// without restarting the bot.
function loadTrip() {
  const sandbox = {};
  global.window = sandbox;
  delete require.cache[TRIP_DATA];
  require(TRIP_DATA);
  return sandbox.TRIP;
}

// trip-data keys are "<monthIndex>-<day>", monthIndex 0=Jan … 5=Jun, 6=Jul
// (matches JavaScript Date.getMonth()). The trip lives in 2026.
const TRIP_YEAR = 2026;
const MON_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Today's date parts in a given timezone, monthIndex 0-based.
function nowParts(tz) {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());            // e.g. "2026-06-23"
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function shiftKey(tz, days) {
  const p = nowParts(tz);
  const dt = new Date(Date.UTC(p.year, p.month, p.day + days));
  return dt.getUTCMonth() + '-' + dt.getUTCDate();
}
const todayKey    = (tz) => shiftKey(tz, 0);
const tomorrowKey = (tz) => shiftKey(tz, 1);

// Human label for a key, e.g. "Thursday, June 25".
function labelForKey(key) {
  const [m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(TRIP_YEAR, m, d));
  const wd  = dt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const mon = dt.toLocaleDateString('en-US', { month: 'long',  timeZone: 'UTC' });
  return `${wd}, ${mon} ${d}`;
}

// Parse a user date argument into a key. Accepts "jun 25", "june 25",
// "6/25" (human month), or a raw "5-25" key.
function parseDateArg(str) {
  if (!str) return null;
  str = str.trim().toLowerCase();
  if (/^\d{1,2}-\d{1,2}$/.test(str)) return str;                 // already a key
  let m = str.match(/^([a-zığşçöü]+)\s+(\d{1,2})$/);             // "jun 25"
  if (m) {
    const idx = MON_ABBR.indexOf(m[1].slice(0, 3));
    if (idx >= 0) return idx + '-' + Number(m[2]);
  }
  m = str.match(/^(\d{1,2})\/(\d{1,2})$/);                       // "6/25"
  if (m) return (Number(m[1]) - 1) + '-' + Number(m[2]);
  return null;
}

// Strip emoji / pictographs so messages stay clean text.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}]/gu;
const clean = (s) => (s || '').replace(EMOJI, '').replace(/\s{2,}/g, ' ').trim();

// Format a day into a WhatsApp message (*bold*, _italic_).
function formatDay(TRIP, key, dateLabel) {
  const day = TRIP.DAYS[key];
  if (!day) return `No plan on file for ${dateLabel}.`;
  const leg = TRIP.LEG_BY_ID[day.legId] || {};
  const out = [];

  out.push(`*${clean(day.title || leg.phase || dateLabel)}*  ·  ${dateLabel}`);
  const sub = [clean(leg.phase), clean(leg.stay)].filter(Boolean).join(' · ');
  if (sub) out.push(`_${sub}_`);
  if (day.summary) out.push('', clean(day.summary));

  const sched = day.schedule || [];
  if (sched.length) {
    out.push('', '*Timeline*');
    sched.forEach((s) => out.push(`• ${s.time ? s.time + ' — ' : ''}${clean(s.text)}`));
  }

  const picks = day.picks || [];
  if (picks.length) {
    out.push('', '*Local picks*');
    picks.forEach((p) => {
      let line = `• ${p.cat ? '[' + p.cat + '] ' : ''}${clean(p.name)}`;
      if (p.note) line += ` — ${clean(p.note)}`;
      if (p.link) line += `\n   ${p.link}`;
      out.push(line);
    });
  }

  if (day.notes) out.push('', `*Note:* ${clean(day.notes)}`);
  return out.join('\n');
}

function helpText(prefix) {
  return [
    '*Odyssey trip bot*',
    `${prefix}today — today's plan & local picks`,
    `${prefix}tomorrow — tomorrow's plan`,
    `${prefix}day <date> — a day, e.g. ${prefix}day jun 25`,
    `${prefix}idea <text> — save an idea for the crew`,
    `${prefix}ideas — list saved ideas`,
    `${prefix}jid — show this chat's id (setup only)`,
  ].join('\n');
}

module.exports = {
  loadTrip, formatDay, parseDateArg, labelForKey,
  todayKey, tomorrowKey, helpText,
};
