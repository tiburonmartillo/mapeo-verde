/**
 * Script de build: obtiene el feed iCal de Google Calendar y genera
 * public/calendar-events.json para usar en producción (GitHub Pages).
 * Se ejecuta sin CORS porque corre en Node.
 *
 * Uso: node scripts/fetch-calendar-events.mjs
 * Opcional: GOOGLE_CALENDAR_ICAL_URL=https://... node scripts/fetch-calendar-events.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ICAL = require('ical.js');

const DEFAULT_URL =
  'https://calendar.google.com/calendar/ical/bce9da9cb33f280d49d3962f712747a07d9728d2954bac9d0c24db0c08f16470%40group.calendar.google.com/public/basic.ics';

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(d) {
  let h = d.getHours();
  const min = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(min).padStart(2, '0')} ${ampm}`;
}

function formatISO(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    'T',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join('');
}

function run() {
  const url = process.env.GOOGLE_CALENDAR_ICAL_URL || DEFAULT_URL;
  console.log('Fetching calendar:', url);

  fetch(url, { headers: { Accept: 'text/calendar' } })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then((icalData) => {
      if (!icalData || !icalData.trim()) {
        console.warn('Empty ical response');
        writeOut([]);
        return;
      }
      const jcal = ICAL.parse(icalData);
      const comp = new ICAL.Component(jcal);
      const vevents = comp.getAllSubcomponents('vevent');
      const events = [];
      const defaultImage =
        'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?q=80&w=1000&auto=format&fit=crop';
      for (let i = 0; i < vevents.length; i++) {
        try {
          const event = new ICAL.Event(vevents[i]);
          const start = event.startDate && event.startDate.toJSDate();
          if (!start) continue;
          const end = event.endDate && event.endDate.toJSDate();
          const date = formatDate(start);
          const startTime = formatTime(start);
          const endTime = end ? formatTime(end) : startTime;
          const time =
            end && end.getTime() !== start.getTime()
              ? `${startTime} - ${endTime}`
              : startTime;
          const uid = event.uid || `event-${i}-${date}`;
          events.push({
            id: uid,
            title: event.summary || 'Sin título',
            date,
            time,
            isoStart: formatISO(start),
            isoEnd: end ? formatISO(end) : formatISO(start),
            location: event.location || '',
            category: 'Evento',
            image: defaultImage,
            description: event.description || '',
          });
        } catch (e) {
          console.warn('Skip event', i, e.message);
        }
      }
      console.log('Parsed', events.length, 'events');
      writeOut(events);
    })
    .catch((err) => {
      console.error('Error fetching calendar:', err.message);
      writeOut([]);
    });
}

function writeOut(events) {
  const publicDir = join(__dirname, '..', 'public');
  mkdirSync(publicDir, { recursive: true });
  const outPath = join(publicDir, 'calendar-events.json');
  writeFileSync(outPath, JSON.stringify(events), 'utf8');
  console.log('Written', outPath);
}

run();
