# Odyssey WhatsApp bot

A small always-on bot that sits in the crew's WhatsApp group and speaks the
itinerary straight from [`../trip-data.js`](../trip-data.js) — the same data the
website renders. Commands:

| Command | Does |
|---|---|
| `/today` | Today's plan + local picks |
| `/tomorrow` | Tomorrow's plan |
| `/day jun 25` | A specific day (`jun 25`, `6/25`, or the raw `5-25` key) |
| `/idea <text>` | Save an idea for the crew |
| `/ideas` | List saved ideas |
| `/jid` | Print the chat id (setup only) |
| `/help` | Command list |

It also posts `/today` automatically each morning (default 08:00 `Europe/Istanbul`).

---

## Heads-up before you start

This uses **Baileys**, which drives a real WhatsApp account over the WhatsApp Web
protocol. That is **against WhatsApp's Terms of Service and risks the number being
banned.** So:

- Use a **spare/secondary number**, not your personal one.
- The bot is **command-only** — it never auto-chats, which keeps it low-profile.
- The `auth_info/` folder is the logged-in session: **private, never committed**
  (already gitignored). Anyone who copies it can impersonate the number.

If a ban would be a problem, the Telegram version of this bot is official, free,
and runs on Vercel with no server — ask and I'll build it instead.

---

## 1. Create the Oracle Always Free VM

1. Sign up at <https://www.oracle.com/cloud/free/> (needs a card for identity; the
   Always Free resources don't charge). Approval can take a while / be fussy — that's
   Oracle, not you.
2. **Compute → Instances → Create instance.**
   - **Image:** Canonical Ubuntu 24.04 (or 22.04).
   - **Shape:** `VM.Standard.A1.Flex` (Ampere/ARM, Always Free) with **1 OCPU / 6 GB**
     — far more than this bot needs. If A1 capacity is unavailable in your region,
     use `VM.Standard.E2.1.Micro` (AMD Always Free, 1 OCPU/1 GB) — also fine.
   - **SSH keys:** upload your public key (or let it generate one and save it).
   - Networking: defaults are fine. **The bot needs only outbound internet — no
     inbound ports**, so you don't have to open anything.
3. Create, then note the instance's **public IP**.

> Oracle reclaims *idle* Always-Free A1 instances. This bot keeps a persistent
> WhatsApp connection (constant light traffic), which normally keeps it out of the
> idle bucket — but don't be surprised if a long-dormant VM gets flagged.

## 2. Install Node and the bot

SSH in (`ssh ubuntu@<public-ip>`), then:

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Get the code
git clone https://github.com/pcsmith2000/odyssey-trip-2026.git odyssey
cd odyssey/bot

# Config
cp .env.example .env
nano .env          # set TZ; leave GROUP_JID blank for now

npm install
```

## 3. Link the WhatsApp number (one time)

```bash
node index.js
```

A QR code prints in the terminal. On the **spare phone**: WhatsApp → **Settings →
Linked devices → Link a device** → scan it. The session is saved to `auth_info/`,
so you only do this once.

## 4. Tell it which group to use

1. Add the linked number to your crew's WhatsApp group.
2. In the group, send **`/jid`**. The bot replies with the group id
   (`…@g.us`).
3. Put that in `.env` as `GROUP_JID=…@g.us`, then `Ctrl-C` and move on to step 5.

(Until `GROUP_JID` is set the bot answers commands in any chat; once set it only
acts in that group — except `/jid`, which always works.)

## 5. Keep it running with systemd

```bash
sudo tee /etc/systemd/system/odyssey-bot.service >/dev/null <<'UNIT'
[Unit]
Description=Odyssey WhatsApp bot
After=network-online.target
Wants=network-online.target

[Service]
WorkingDirectory=/home/ubuntu/odyssey/bot
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
User=ubuntu

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now odyssey-bot
journalctl -u odyssey-bot -f      # watch logs
```

## Updating the itinerary

The bot re-reads `trip-data.js` from disk on every command, so:

```bash
cd ~/odyssey && git pull
sudo systemctl restart odyssey-bot   # also refreshes the daily-push schedule
```

## Troubleshooting

- **Stuck / "logged out" in logs:** delete `auth_info/` and re-run step 3.
- **No daily message:** check `GROUP_JID` is set and `PUSH_CRON` is valid; logs show
  "daily push failed" on errors.
- **Want verbose logs:** set `LOG_LEVEL=info` in `.env` and restart.
- **Tear down after the trip:** `sudo systemctl disable --now odyssey-bot`, then
  delete the Oracle instance.
