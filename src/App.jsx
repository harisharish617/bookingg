import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
const HotelCard = lazyloading(() => import('./components/HotelCard.jsx'));
const BookingPage = lazyloading(() => import('./components/BookingPage.jsx'));
const LoadingChunk = () => <div className="state-message" role="status">Loading page…</div>;
import { useDispatch, useSelector } from 'react-redux';
import { cancelBooking, createBooking, loadHotels, loadReservations, login, logout, updateBooking } from './store';

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const dayDiff = (start, end) => Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000));
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

function App() {
  const dispatch = useDispatch();
  const hotelsState = useSelector(s => s.hotels);
  const auth = useSelector(s => s.auth);
  const reservations = useSelector(s => s.reservations);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All locations');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);
  const [activeTab, setActiveTab] = useState('hotels');
  const [notice, setNotice] = useState('');
  const [loginEmail, setLoginEmail] = useState('guest@stayease.com');
  const [loginPassword, setLoginPassword] = useState('demo123');
  const [authMode, setAuthMode] = useState('login');
  const [account, setAccount] = useState({
    fullName: '', mobile: '', aadhaar: '', personalId: '', dateOfBirth: '',
    gender: '', address: '', email: '', password: '', confirmPassword: ''
  });

  useEffect(() => { dispatch(loadHotels()); }, [dispatch]);
  useEffect(() => { if (auth.token) dispatch(loadReservations()); }, [auth.token, dispatch]);

  const locations = useMemo(() => ['All locations', ...new Set(hotelsState.items.map(h => h.location))], [hotelsState.items]);
  const filteredHotels = useMemo(() => hotelsState.items.filter(h =>
    (h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase())) &&
    (location === 'All locations' || h.location === location) && (!availableOnly || h.available)
  ), [hotelsState.items, search, location, availableOnly]);
  const chosenRoom = selectedHotel?.rooms.find(r => r.id === Number(roomId)) || selectedHotel?.rooms[0];
  const nights = dayDiff(checkIn, checkOut);
  const roomCost = chosenRoom ? chosenRoom.price * nights : 0;
  const taxes = Math.round(roomCost * 0.12);
  const total = roomCost + taxes;

  useEffect(() => {
    console.debug('[StayEase UI] Hotel list/filter state:', {
      search, location, availableOnly,
      totalHotels: hotelsState.items.length,
      visibleHotels: filteredHotels.length
    });
  }, [search, location, availableOnly, hotelsState.items.length, filteredHotels.length]);

  useEffect(() => {
    if (selectedHotel) {
      console.debug('[StayEase UI] Booking price calculation:', {
        hotel: selectedHotel.name,
        room: chosenRoom?.name,
        checkIn, checkOut, nights, guests, roomCost, taxes, total
      });
    }
  }, [selectedHotel, chosenRoom, checkIn, checkOut, nights, guests, roomCost, taxes, total]);

  function handleLogin(e) {
    e.preventDefault();
    console.groupCollapsed('%c[StayEase UI] Login submitted', 'color:#0b8f87;font-weight:bold');
    console.info('Email:', loginEmail);
    // Never log the password or authentication token.
    if (!loginEmail.includes('@') || loginPassword.length < 4) {
      console.warn('Login validation failed: enter a valid email and a password with at least 4 characters.');
      console.groupEnd();
      setNotice('Enter a valid email and a password with at least 4 characters.');
      return;
    }
    const token = `demo-token-${Date.now()}`;
    localStorage.setItem('stayease_token', token);
    localStorage.setItem('stayease_user', loginEmail);
    dispatch(login({ token, user: loginEmail }));
    console.info('Login successful for:', loginEmail);
    console.info('Protected booking features are now available.');
    console.groupEnd();
    setNotice('Login successful. Protected booking features are now available.');
  }

  function handleCreateAccount(e) {
    e.preventDefault();
    const digits = value => value.replace(/\D/g, '');
    if (account.fullName.trim().length < 2) {
      setNotice('Enter your full name.'); return;
    }
    if (!/^[6-9]\d{9}$/.test(digits(account.mobile))) {
      setNotice('Enter a valid 10-digit Indian mobile number.'); return;
    }
    if (!/^\d{12}$/.test(digits(account.aadhaar))) {
      setNotice('Aadhaar field must contain 12 digits. Use demo details only.'); return;
    }
    if (account.personalId.trim().length < 3) {
      setNotice('Enter your personal ID.'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) {
      setNotice('Enter a valid email address.'); return;
    }
    if (account.password.length < 8 || !/[A-Za-z]/.test(account.password) || !/\d/.test(account.password)) {
      setNotice('Password must be at least 8 characters and include a letter and a number.'); return;
    }
    if (account.password !== account.confirmPassword) {
      setNotice('Passwords do not match.'); return;
    }
    const users = JSON.parse(localStorage.getItem('stayease_demo_accounts') || '[]');
    if (users.some(user => user.email.toLowerCase() === account.email.toLowerCase())) {
      setNotice('An account with this email already exists. Please sign in.'); return;
    }
    // Demo only: identity fields are validated but not saved. Do not use real Aadhaar/ID details.
    users.push({ fullName: account.fullName.trim(), mobile: digits(account.mobile), email: account.email.trim(), password: account.password });
    localStorage.setItem('stayease_demo_accounts', JSON.stringify(users));
    const token = `demo-token-${Date.now()}`;
    localStorage.setItem('stayease_token', token);
    localStorage.setItem('stayease_user', account.email.trim());
    dispatch(login({ token, user: account.email.trim() }));
    setActiveTab('hotels');
    setAuthMode('login');
    setNotice('Account created successfully. Welcome to StayEase!');
  }

  function handleLogout() {
    console.groupCollapsed('%c[StayEase UI] Logout', 'color:#b45309;font-weight:bold');
    console.info('Logging out user:', auth.user || '(unknown user)');
    localStorage.removeItem('stayease_token');
    localStorage.removeItem('stayease_user');
    dispatch(logout());
    setActiveTab('hotels');
    setNotice('You have been logged out.');
    console.info('Logout complete. Authentication data cleared from localStorage.');
    console.groupEnd();
  }

  async function handleBooking(e) {
    e.preventDefault();
    console.groupCollapsed('%c[StayEase UI] Booking submitted', 'color:#0b8f87;font-weight:bold');
    if (!auth.token) {
      console.warn('Booking blocked: user is not logged in.');
      console.groupEnd();
      setActiveTab('login');
      setNotice('Please log in before booking a room.');
      return;
    }
    if (!selectedHotel || !chosenRoom || checkOut <= checkIn) {
      console.warn('Booking validation failed:', {
        hotelSelected: Boolean(selectedHotel),
        roomSelected: Boolean(chosenRoom),
        checkIn,
        checkOut
      });
      console.groupEnd();
      setNotice('Choose a hotel, room, and valid check-in/check-out dates.');
      return;
    }
    const bookingDetails = {
      hotelId: selectedHotel.id, hotelName: selectedHotel.name, location: selectedHotel.location,
      roomId: chosenRoom.id, roomName: chosenRoom.name, checkIn, checkOut, nights, guests,
      roomCost, taxes, total, status: 'Confirmed'
    };
    console.table([{
      hotel: bookingDetails.hotelName,
      location: bookingDetails.location,
      room: bookingDetails.roomName,
      checkIn, checkOut, nights, guests, roomCost, taxes, total
    }]);
    const action = await dispatch(createBooking(bookingDetails));
    if (createBooking.fulfilled.match(action)) {
      console.info('BOOKING SUCCESS:', action.payload);
      setNotice('Reservation confirmed! Your booking has been saved.');
      setSelectedHotel(null);
      setActiveTab('reservations');
    } else {
      console.error('BOOKING FAILED:', action.payload || action.error);
      setNotice(action.payload || 'Booking failed.');
    }
    console.groupEnd();
  }

  async function handleCancel(id) {
    console.groupCollapsed('%c[StayEase UI] Cancel reservation', 'color:#b45309;font-weight:bold');
    console.info('Reservation ID:', id);
    if (window.confirm('Cancel this reservation?')) {
      const action = await dispatch(cancelBooking(id));
      if (cancelBooking.fulfilled.match(action)) {
        console.info('CANCELLATION SUCCESS:', { reservationId: id });
        setNotice('Reservation cancelled.');
      } else {
        console.error('CANCELLATION FAILED:', action.payload || action.error);
        setNotice(action.payload || 'Cancellation failed.');
      }
    } else {
      console.info('Cancellation cancelled by user in confirmation dialog.');
    }
    console.groupEnd();
  }

  async function handleEdit(reservation) {
    console.groupCollapsed('%c[StayEase UI] Edit reservation', 'color:#6d5bd0;font-weight:bold');
    console.info('Current reservation:', reservation);
    const nextGuestsInput = window.prompt('Enter updated number of guests (1–5):', String(reservation.guests));
    if (nextGuestsInput === null) {
      console.info('Edit cancelled by user.');
      console.groupEnd();
      return;
    }
    const nextGuests = Number(nextGuestsInput);
    if (Number.isInteger(nextGuests) && nextGuests >= 1 && nextGuests <= 5) {
      const changes = { guests: nextGuests };
      console.info('Requested changes:', changes);
      const action = await dispatch(updateBooking({ id: reservation.id, changes }));
      if (updateBooking.fulfilled.match(action)) {
        console.info('RESERVATION UPDATE SUCCESS:', action.payload);
        setNotice('Reservation details updated.');
      } else {
        console.error('RESERVATION UPDATE FAILED:', action.payload || action.error);
        setNotice(action.payload || 'Unable to update reservation.');
      }
    } else {
      console.warn('Edit validation failed. Guest count must be a whole number from 1 to 5.', nextGuestsInput);
      setNotice('Enter a whole number of guests from 1 to 5.');
    }
    console.groupEnd();
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-icon">S</span><div><strong>StayEase</strong><small>Find your perfect stay</small></div></div>
      <nav><button className={activeTab === 'hotels' ? 'nav active' : 'nav'} onClick={() => setActiveTab('hotels')}>Explore stays</button>
        <button className={activeTab === 'reservations' ? 'nav active' : 'nav'} onClick={() => { if (auth.token) { setActiveTab('reservations'); dispatch(loadReservations()); } else { setActiveTab('login'); setNotice('Log in to view reservation history.'); } }}>My reservations</button>
        {auth.token ? <button className="user-pill" onClick={handleLogout}>👤 {auth.user.split('@')[0]} · Logout</button> : <button className="login-nav" onClick={() => setActiveTab('login')}>Log in</button>}
      </nav>
    </header>

    <main>
      {activeTab === 'hotels' && <>
        <section className="hero"><div className="hero-copy"><span className="eyebrow">YOUR NEXT GETAWAY STARTS HERE</span><h1>Stay somewhere<br/><em>extraordinary.</em></h1><p>Discover handpicked stays for your next city break, hill escape, or beach holiday.</p></div><div className="hero-art"><div className="sun"></div><div className="hero-building">🏨</div><div className="hero-caption">Good stays. Great stories.</div></div></section>
        <section className="search-panel"><div className="field search-field"><label>Search hotels</label><input value={search} onChange={e => { setSearch(e.target.value); console.info("[StayEase UI] Hotel search:", e.target.value); }} placeholder="Hotel name or destination"/></div>
          <div className="field"><label>Destination</label><select value={location} onChange={e => { setLocation(e.target.value); console.info("[StayEase UI] Destination filter:", e.target.value); }}>{locations.map(x => <option key={x}>{x}</option>)}</select></div>
          <label className="availability"><input type="checkbox" checked={availableOnly} onChange={e => { setAvailableOnly(e.target.checked); console.info("[StayEase UI] Available-only filter:", e.target.checked); }}/> Available only</label>
        </section>
        <div className="section-heading"><div><span className="eyebrow">CURATED FOR YOU</span><h2>Popular stays</h2></div><span className="result-count">{filteredHotels.length} properties</span></div>
        {hotelsState.status === 'loading' && <div className="state-message"><span className="spinner"></span>Loading hotel information…</div>}
        {hotelsState.status === 'failed' && <div className="error-message">Could not load hotels. <button onClick={() => dispatch(loadHotels())}>Try again</button></div>}
        {hotelsState.status === 'succeeded' && filteredHotels.length === 0 && <div className="state-message">No stays match those filters. Try another destination.</div>}
        <section className="hotel-grid" aria-label="Hotel results"><Suspense fallback={<LoadingChunk />}>{filteredHotels.map(h => <HotelCard key={h.id} hotel={h} onSelect={hotel => { setSelectedHotel(hotel); setRoomId(String(hotel.rooms[0].id)); setNotice(''); }} />)}</Suspense></section>
      </>}
      {activeTab === 'login' && <section className="login-layout"><div className="login-art"><span>✦</span><h2>Every journey<br/>deserves a great stay.</h2><p>Create an account or sign in to manage reservations and keep your travel plans in one place.</p><p className="privacy-note">Academic demo only. Do not enter real Aadhaar or personal identity numbers.</p></div>
        {authMode === 'login' ? <form className="login-card" onSubmit={handleLogin}><span className="eyebrow">WELCOME BACK</span><h2>Sign in to StayEase</h2><p className="muted">Sign in to continue your booking.</p><label>Email address</label><input type="email" autoComplete="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required/><label>Password</label><input type="password" autoComplete="current-password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required minLength="4"/><button className="primary wide">Sign in securely</button><button type="button" className="text-button" onClick={() => setAuthMode('register')}>New here? Create an account</button><small className="demo-hint">Demo login: guest@stayease.com / demo123</small></form>
        : <form className="login-card account-card" onSubmit={handleCreateAccount}><span className="eyebrow">JOIN STAYEASE</span><h2>Create your account</h2><p className="muted">Enter your details to create a demo account.</p>
          <div className="account-fields">
            <label>Full name<input autoComplete="name" value={account.fullName} onChange={e => setAccount({...account, fullName:e.target.value})} required minLength="2" placeholder="Your full name"/></label>
            <label>Mobile number<input autoComplete="tel" type="tel" inputMode="numeric" maxLength="10" value={account.mobile} onChange={e => setAccount({...account, mobile:e.target.value.replace(/\D/g,'').slice(0,10)})} required placeholder="10-digit mobile number"/></label>
            <label>Aadhaar details (12 digits)<input inputMode="numeric" maxLength="12" value={account.aadhaar} onChange={e => setAccount({...account, aadhaar:e.target.value.replace(/\D/g,'').slice(0,12)})} required placeholder="Demo number only"/></label>
            <label>Personal ID / Student ID<input value={account.personalId} onChange={e => setAccount({...account, personalId:e.target.value})} required placeholder="Personal or student ID"/></label>
            <label>Date of birth<input type="date" value={account.dateOfBirth} onChange={e => setAccount({...account, dateOfBirth:e.target.value})} required max={today}/></label>
            <label>Gender (optional)<select value={account.gender} onChange={e => setAccount({...account, gender:e.target.value})}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option></select></label>
            <label>Email address<input type="email" autoComplete="email" value={account.email} onChange={e => setAccount({...account, email:e.target.value})} required placeholder="you@example.com"/></label>
            <label>Address<input autoComplete="street-address" value={account.address} onChange={e => setAccount({...account, address:e.target.value})} required placeholder="City / postal address"/></label>
            <label>Password<input type="password" autoComplete="new-password" value={account.password} onChange={e => setAccount({...account,password:e.target.value})} required minLength="8" placeholder="At least 8 characters, include a number"/></label>
            <label>Confirm password<input type="password" autoComplete="new-password" value={account.confirmPassword} onChange={e => setAccount({...account,confirmPassword:e.target.value})} required minLength="8" placeholder="Re-enter password"/></label>
          </div>
          <button className="primary wide">Create account</button><button type="button" className="text-button" onClick={() => setAuthMode('login')}>Already registered? Sign in</button>
          <small className="demo-hint">Demo only: Aadhaar, personal ID, date of birth and address are not saved.</small>
        </form>}
      </section>}
      {activeTab === 'reservations' && <section className="reservation-section"><span className="eyebrow">YOUR TRAVEL PLANS</span><h2>My reservations</h2><p className="muted">View, update, or cancel your hotel bookings.</p>
        {!auth.token && <div className="error-message">You need to log in to view protected reservations. <button onClick={() => setActiveTab('login')}>Log in</button></div>}
        {auth.token && reservations.status === 'loading' && <div className="state-message"><span className="spinner"></span>Loading reservations…</div>}
        {auth.token && reservations.error && <div className="error-message">{reservations.error} <button onClick={() => dispatch(loadReservations())}>Retry</button></div>}
        {auth.token && reservations.status !== 'loading' && !reservations.error && reservations.items.length === 0 && <div className="empty-state"><span>🧳</span><h3>No reservations yet</h3><p>Your next adventure is waiting.</p><button className="primary" onClick={() => setActiveTab('hotels')}>Explore hotels</button></div>}
        {auth.token && reservations.items.map(r => <article className="reservation-card" key={r.id}><div className="reservation-icon">🏨</div><div className="reservation-main"><h3>{r.hotelName}</h3><p>{r.location} · {r.roomName} · {r.guests} guest(s)</p><p>{r.checkIn} → {r.checkOut} · {r.nights} night(s)</p><span className="confirmed">● {r.status || 'Confirmed'}</span></div><div className="reservation-price"><strong>{money(r.total)}</strong><small>incl. taxes</small><div className="reservation-actions"><button onClick={() => handleEdit(r)}>Edit guests</button><button className="cancel" onClick={() => handleCancel(r.id)}>Cancel</button></div></div></article>)}
      </section>}
    </main>
    <footer><div className="footer-brand">StayEase <span>·</span> Stay a little better.</div><p>Scenario 4 · Hotel Room Booking Web Application</p><div className="footer-tags"><span>REST API</span><span>Redux Toolkit</span><span>CRUD</span><span>Token Auth</span></div></footer>

    {selectedHotel && <Suspense fallback={<LoadingChunk />}><BookingPage hotel={selectedHotel} roomId={roomId} setRoomId={setRoomId} rooms={selectedHotel.rooms} checkIn={checkIn} setCheckIn={setCheckIn} checkOut={checkOut} setCheckOut={setCheckOut} guests={guests} setGuests={setGuests} today={today} tomorrow={tomorrow} nights={nights} chosenRoom={chosenRoom} roomCost={roomCost} taxes={taxes} total={total} authenticated={Boolean(auth.token)} onSubmit={handleBooking} onClose={() => setSelectedHotel(null)} /></Suspense>}
    {notice && <div className="toast" role="status"><span>✓</span>{notice}<button onClick={() => setNotice('')}>×</button></div>}
  </div>;
}
export default App;