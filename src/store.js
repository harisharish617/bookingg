import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from './api';


import { hotels as localHotels } from './data';


export const loadHotels = createAsyncThunk(
  'hotels/load',
  async () => {
    return localHotels;
  }
);


export const loadReservations = createAsyncThunk('reservations/load', async (_, { rejectWithValue }) => {
  try { return (await api.getReservations()).data; }
  catch (e) { return rejectWithValue(e.response?.status === 401 ? 'Please log in to view reservations.' : 'Unable to load reservations.'); }
});
export const createBooking = createAsyncThunk('reservations/create', async (payload, { rejectWithValue }) => {
  try { return (await api.createReservation(payload)).data; }
  catch (e) { return rejectWithValue(e.response?.status === 401 ? 'Session expired. Please log in again.' : 'Booking failed. Please try again.'); }
});
export const cancelBooking = createAsyncThunk('reservations/cancel', async (id, { rejectWithValue }) => {
  try { await api.deleteReservation(id); return id; }
  catch (e) { return rejectWithValue(e.response?.status === 401 ? 'Please log in again.' : 'Unable to cancel reservation.'); }
});
export const updateBooking = createAsyncThunk('reservations/update', async ({ id, changes }, { rejectWithValue }) => {
  try { return (await api.updateReservation(id, changes)).data; }
  catch (e) { return rejectWithValue(e.response?.status === 401 ? 'Please log in again.' : (e.response?.data?.message || e.message || 'Unable to update reservation.')); }
});

const hotelsSlice = createSlice({
  name: 'hotels', initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: b => b.addCase(loadHotels.pending, s => { s.status = 'loading'; s.error = null; })
    .addCase(loadHotels.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload; })
    .addCase(loadHotels.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; })
});
const authSlice = createSlice({
  name: 'auth',
  initialState: { token: localStorage.getItem('stayease_token') || '', user: localStorage.getItem('stayease_user') || '' },
  reducers: {
    login(s, a) { s.token = a.payload.token; s.user = a.payload.user; },
    logout(s) { s.token = ''; s.user = ''; }
  }
});
const reservationsSlice = createSlice({
  name: 'reservations', initialState: { items: [], status: 'idle', error: null, lastBooking: null },
  reducers: { clearReservationError(s) { s.error = null; } },
  extraReducers: b => {
    b.addCase(loadReservations.pending, s => { s.status = 'loading'; s.error = null; })
      .addCase(loadReservations.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload; })
      .addCase(loadReservations.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload || a.error.message; })
      .addCase(createBooking.pending, s => { s.status = 'loading'; s.error = null; })
      .addCase(createBooking.fulfilled, (s, a) => { s.status = 'succeeded'; s.items.unshift(a.payload); s.lastBooking = a.payload; })
      .addCase(createBooking.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload || a.error.message; })
      .addCase(cancelBooking.fulfilled, (s, a) => { s.items = s.items.filter(x => x.id !== a.payload); })
      .addCase(cancelBooking.rejected, (s, a) => { s.error = a.payload || a.error.message; })
      .addCase(updateBooking.fulfilled, (s, a) => { s.items = s.items.map(x => x.id === a.payload.id ? a.payload : x); });
  }
});
export const { login, logout } = authSlice.actions;
export const { clearReservationError } = reservationsSlice.actions;

// Middleware example: persist booking-related state changes to browser storage.
const bookingPersistence = storeAPI => next => action => {
  const safePayload = action.type === login.type
    ? { user: action.payload?.user, token: action.payload?.token ? '[REDACTED]' : '' }
    : action.payload;
  console.groupCollapsed(`%c[StayEase Redux] ${action.type}`, 'color:#7c3aed;font-weight:bold');
  if (safePayload !== undefined) console.log('Action payload:', safePayload);
  const result = next(action);
  const state = storeAPI.getState();
  console.debug('State summary:', {
    hotelCount: state.hotels.items.length,
    hotelsStatus: state.hotels.status,
    isAuthenticated: Boolean(state.auth.token),
    user: state.auth.user,
    reservationCount: state.reservations.items.length,
    reservationsStatus: state.reservations.status,
    reservationError: state.reservations.error
  });
  console.groupEnd();

  if ([createBooking.fulfilled.type, cancelBooking.fulfilled.type, updateBooking.fulfilled.type].includes(action.type)) {
    localStorage.setItem('stayease_last_action', JSON.stringify({ type: action.type, at: new Date().toISOString() }));
  }
  if (action.type.endsWith('/rejected')) console.error('[StayEase Redux] Async action failed:', action.payload || action.error);
  return result;
};
export const store = configureStore({ reducer: { hotels: hotelsSlice.reducer, auth: authSlice.reducer, reservations: reservationsSlice.reducer }, middleware: gDM => gDM().concat(bookingPersistence) });
