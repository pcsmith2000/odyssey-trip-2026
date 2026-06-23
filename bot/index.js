'use strict';
// ─────────────────────────────────────────────────────────────
//  Odyssey WhatsApp group bot (Baileys).
//
//  Sits in the crew's WhatsApp group via a linked (spare) number and
//  answers commands from trip-data.js, plus posts a daily "today" plan.
//
//  NOTE: this drives a real WhatsApp account through the WhatsApp Web
//  protocol — against WhatsApp's ToS, with a real ban risk. Use a
//  secondary number, keep it command-only (it never spams), and keep
//  the server's auth_info/ directory private.
// ─────────────────────────────────────────────────────────────

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const cron = require('node-cron');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket, useMultiFileAuthState,
  DisconnectReason, fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const {
  loadTrip, formatDay, parseDateArg, labelForKey,
  todayKey, tomorrowKey, helpText,
} = require('./trip');

const TZ        = process.env.TZ || 'Europe/Istanbul';
const GROUP_JID = (process.env.GROUP_JID || '').trim();
const PREFIX    = process.env.COMMAND_PREFIX || '/';
const PUSH_CRON = process.env.PUSH_CRON || '0 8 * * *';
const AUTH_DIR  = path.join(__dirname, 'auth_info');
const IDEAS_FILE = path.join(__dirname, 'data', 'ideas.json');
const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });

fs.mkdirSync(path.dirname(IDEAS_FILE), { recursive: true });
const readIdeas  = () => { try { return JSON.parse(fs.readFileSync(IDEAS_FILE, 'utf8')); } catch { return []; } };
const writeIdeas = (a) => fs.writeFileSync(IDEAS_FILE, JSON.stringify(a, null, 2));

let sock;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({ version, auth: state, logger, markOnlineOnConnect: false });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      console.log('\nScan in WhatsApp → Linked devices → Link a device:\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      console.log('Connected to WhatsApp as', sock.user && sock.user.id);
      if (!GROUP_JID) console.log('GROUP_JID not set — send "' + PREFIX + 'jid" in the group to get it.');
    }
    if (connection === 'close') {
      const code = lastDisconnect && lastDisconnect.error
        && lastDisconnect.error.output && lastDisconnect.error.output.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('Logged out. Delete the auth_info/ folder and restart to re-link.');
      } else {
        console.log('Connection closed (' + code + ') — reconnecting…');
        start();
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try { await handle(msg); } catch (e) { console.error('handle error:', e); }
    }
  });
}

const reply = (jid, msg, text) => sock.sendMessage(jid, { text }, { quoted: msg });

async function handle(msg) {
  if (!msg.message || msg.key.fromMe) return;
  const jid = msg.key.remoteJid;
  if (!jid || jid === 'status@broadcast') return;

  const text = (msg.message.conversation
    || (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text)
    || '').trim();
  if (!text) return;

  // /jid works in any chat so you can discover the group id during setup.
  if (/^\/?jid$/i.test(text)) return reply(jid, msg, 'This chat id:\n' + jid);

  // Once GROUP_JID is configured, only act in that group.
  if (GROUP_JID && jid !== GROUP_JID) return;

  if (!text.startsWith(PREFIX)) return;          // command-only; never chatty
  const parts = text.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = (parts.shift() || '').toLowerCase();
  const arg = parts.join(' ').trim();
  const TRIP = loadTrip();

  switch (cmd) {
    case 'help':
      return reply(jid, msg, helpText(PREFIX));

    case 'today': {
      const k = todayKey(TZ);
      return reply(jid, msg, formatDay(TRIP, k, labelForKey(k)));
    }
    case 'tomorrow': {
      const k = tomorrowKey(TZ);
      return reply(jid, msg, formatDay(TRIP, k, labelForKey(k)));
    }
    case 'day': {
      const k = parseDateArg(arg);
      if (!k) return reply(jid, msg, `Couldn't read that date. Try "${PREFIX}day jun 25".`);
      return reply(jid, msg, formatDay(TRIP, k, labelForKey(k)));
    }
    case 'idea': {
      if (!arg) return reply(jid, msg, `Add an idea like: ${PREFIX}idea Sunset swim at Patriça`);
      const ideas = readIdeas();
      ideas.push({ text: arg, by: msg.pushName || 'someone', at: new Date().toISOString() });
      writeIdeas(ideas);
      return reply(jid, msg, `Saved (${ideas.length} total). List them with ${PREFIX}ideas.`);
    }
    case 'ideas': {
      const ideas = readIdeas();
      if (!ideas.length) return reply(jid, msg, `No ideas yet. Add one: ${PREFIX}idea …`);
      return reply(jid, msg, '*Crew ideas*\n'
        + ideas.map((i, n) => `${n + 1}. ${i.text} — _${i.by}_`).join('\n'));
    }
    default:
      return; // ignore unknown commands to stay quiet
  }
}

// Daily "today" push to the group.
if (cron.validate(PUSH_CRON)) {
  cron.schedule(PUSH_CRON, async () => {
    if (!GROUP_JID || !sock) return;
    try {
      const TRIP = loadTrip();
      const k = todayKey(TZ);
      await sock.sendMessage(GROUP_JID, {
        text: 'Good morning. Today on the Odyssey:\n\n' + formatDay(TRIP, k, labelForKey(k)),
      });
    } catch (e) { console.error('daily push failed:', e); }
  }, { timezone: TZ });
} else {
  console.error('Invalid PUSH_CRON, daily push disabled:', PUSH_CRON);
}

start().catch((e) => { console.error('fatal:', e); process.exit(1); });
