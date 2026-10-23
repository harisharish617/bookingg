import React from 'react';
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export default function BookingPage({hotel,roomId,setRoomId,rooms,checkIn,setCheckIn,checkOut,setCheckOut,guests,setGuests,today,tomorrow,nights,chosenRoom,roomCost,taxes,total,authenticated,onSubmit,onClose}) {
 if (!hotel) return null;
 return <div className="modal-backdrop" onClick={onClose}><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title" onClick={e=>e.stopPropagation()}>
 <button className="close" type="button" onClick={onClose} aria-label="Close booking dialog">×</button><span className="eyebrow">COMPLETE YOUR STAY</span><h2 id="booking-title">{hotel.name}</h2><p className="muted">⌖ {hotel.location} · ★ {hotel.rating}</p>
 <form onSubmit={onSubmit}><label htmlFor="room-type">Room type</label><select id="room-type" value={roomId || hotel.rooms[0].id} onChange={e=>setRoomId(e.target.value)}>{rooms.map(r=><option value={r.id} key={r.id}>{r.name} — {money(r.price)}/night (up to {r.capacity} guests)</option>)}</select>
 <div className="date-row"><div><label htmlFor="check-in">Check-in</label><input id="check-in" type="date" min={today} value={checkIn} onChange={e=>setCheckIn(e.target.value)} required /></div><div><label htmlFor="check-out">Check-out</label><input id="check-out" type="date" min={checkIn > today ? checkIn : tomorrow} value={checkOut} onChange={e=>setCheckOut(e.target.value)} required /></div></div>
 <label htmlFor="guest-count">Guests</label><select id="guest-count" value={guests} onChange={e=>setGuests(Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} guest{n>1?'s':''}</option>)}</select>
 <div className="price-breakdown" aria-live="polite"><div><span>{chosenRoom ? money(chosenRoom.price) : '₹0'} × {nights} night(s)</span><span>{money(roomCost)}</span></div><div><span>Taxes and fees (12%)</span><span>{money(taxes)}</span></div><div className="total-line"><strong>Total amount</strong><strong>{money(total)}</strong></div></div>
 {!authenticated && <p className="login-warning">Please sign in to confirm your reservation.</p>}<button className="primary wide" type="submit">Confirm booking · {money(total)}</button></form></section></div>;
}
