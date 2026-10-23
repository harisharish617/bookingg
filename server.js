import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hotels } from './src/data.js';

const app = express();
const PORT = 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'reservations.json');

app.use(cors());
app.use(express.json());

function readReservations() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    console.error('[SERVER] Could not read reservations.json:', error.message);
    return [];
  }
}
function saveReservations(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}
function logRequest(req, status, extra = {}) {
  console.log(`[SERVER] ${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${status}`, extra);
}
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !token.startsWith('demo-token-')) {
    logRequest(req, 401, { error: 'Unauthorized' });
    return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
  }
  req.userEmail = req.headers['x-demo-user'] || 'guest@stayease.com';
  next();
}

app.get('/api/health', (req, res) => {
  logRequest(req, 200);
  res.json({ status: 'ok', service: 'StayEase REST API' });
});

app.get('/api/hotels', (req, res) => {
  logRequest(req, 200, { count: hotels.length });
  res.json(hotels);
});

app.get('/api/hotels/:id', (req, res) => {
  const hotel = hotels.find(item => item.id === Number(req.params.id));
  logRequest(req, hotel ? 200 : 404, { hotelId: req.params.id });
  if (!hotel) return res.status(404).json({ message: 'Hotel not found.' });
  res.json(hotel);
});

app.get('/api/reservations', requireAuth, (req, res) => {
  const items = readReservations();
  logRequest(req, 200, { count: items.length });
  res.json(items);
});

app.post('/api/reservations', requireAuth, (req, res) => {
  const required = ['hotelId', 'hotelName', 'roomName', 'checkIn', 'checkOut', 'guests', 'total'];
  const missing = required.filter(key => req.body[key] === undefined || req.body[key] === '');
  if (missing.length) {
    logRequest(req, 400, { missing });
    return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
  }
  const items = readReservations();
  const item = {
    ...req.body,
    id: Date.now(),
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
    userEmail: req.userEmail
  };
  items.unshift(item);
  saveReservations(items);
  logRequest(req, 201, { reservationId: item.id, hotel: item.hotelName });
  res.status(201).json(item);
});

app.patch('/api/reservations/:id', requireAuth, (req, res) => {
  const items = readReservations();
  const index = items.findIndex(item => item.id === Number(req.params.id));
  if (index < 0) {
    logRequest(req, 404, { reservationId: req.params.id });
    return res.status(404).json({ message: 'Reservation not found.' });
  }
  const allowed = ['guests', 'checkIn', 'checkOut', 'roomName', 'roomId', 'status'];
  const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  items[index] = { ...items[index], ...changes, updatedAt: new Date().toISOString() };
  saveReservations(items);
  logRequest(req, 200, { reservationId: items[index].id, changes });
  res.json(items[index]);
});

app.delete('/api/reservations/:id', requireAuth, (req, res) => {
  const items = readReservations();
  const found = items.find(item => item.id === Number(req.params.id));
  if (!found) {
    logRequest(req, 404, { reservationId: req.params.id });
    return res.status(404).json({ message: 'Reservation not found.' });
  }
  saveReservations(items.filter(item => item.id !== Number(req.params.id)));
  logRequest(req, 200, { reservationId: found.id, deleted: true });
  res.json({ success: true, id: found.id });
});

app.use((error, req, res, next) => {
  console.error('[SERVER ERROR]', error);
  logRequest(req, 500, { message: error.message });
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`\nStayEase REST API running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
