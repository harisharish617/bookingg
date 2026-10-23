const calculateBooking = (pricePerNight, nights, taxRate = 0.12) => {
  const roomCost = pricePerNight * nights;
  const taxes = Math.round(roomCost * taxRate);
  return { roomCost, taxes, total: roomCost + taxes };
};

test('calculates room cost, tax and total correctly', () => {
  expect(calculateBooking(2500, 3)).toEqual({ roomCost: 7500, taxes: 900, total: 8400 });
});

test('calculates one-night booking without tax rounding errors', () => {
  expect(calculateBooking(999, 1)).toEqual({ roomCost: 999, taxes: 120, total: 1119 });
});
