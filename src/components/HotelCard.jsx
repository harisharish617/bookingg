import React from 'react';
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export default function HotelCard({ hotel, onSelect }) {
 return <article className="hotel-card" aria-label={`${hotel.name} hotel card`}>
  <div className={`hotel-image image-${hotel.id}`}><span className="hotel-emoji" aria-hidden="true">{hotel.image}</span><span className="rating" aria-label={`Rating ${hotel.rating}`}>★ {hotel.rating}</span>{!hotel.available && <span className="sold-out">Unavailable</span>}</div>
  <div className="hotel-content"><div className="location">⌖ {hotel.location}</div><h3>{hotel.name}</h3><p>{hotel.description}</p><div className="amenities">{hotel.amenities.slice(0,3).map(a => <span key={a}>{a}</span>)}</div>
   <div className="hotel-footer"><div><strong>{money(hotel.price)}</strong><small> / night · taxes extra</small></div><button disabled={!hotel.available} onClick={() => onSelect(hotel)} aria-label={`View rooms at ${hotel.name}`}>View rooms <span aria-hidden="true">→</span></button></div></div></article>;
}
