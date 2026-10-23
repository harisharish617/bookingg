import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HotelCard from './HotelCard';

const hotel = { id: 1, name: 'Ocean View Hotel', location: 'Chennai', image: '🏨', rating: 4.7, available: true, description: 'A relaxing stay by the coast.', amenities: ['Wi-Fi', 'Pool', 'Breakfast', 'Parking'], price: 3500, rooms: [{id: 1}] };

test('renders hotel details and nightly price', () => {
  render(<HotelCard hotel={hotel} onSelect={() => {}} />);
  expect(screen.getByRole('heading', { name: 'Ocean View Hotel' })).toBeInTheDocument();
  expect(screen.getByText('Chennai')).toBeInTheDocument();
  expect(screen.getByText(/3,500/)).toBeInTheDocument();
});

test('selects a hotel when View rooms is clicked', async () => {
  const user = userEvent.setup();
  const onSelect = jest.fn();
  render(<HotelCard hotel={hotel} onSelect={onSelect} />);
  await user.click(screen.getByRole('button', { name: 'View rooms at Ocean View Hotel' }));
  expect(onSelect).toHaveBeenCalledWith(hotel);
});

test('disables room selection for unavailable hotels', () => {
  render(<HotelCard hotel={{ ...hotel, available: false }} onSelect={() => {}} />);
  expect(screen.getByRole('button', { name: 'View rooms at Ocean View Hotel' })).toBeDisabled();
  expect(screen.getByText('Unavailable')).toBeInTheDocument();
});
