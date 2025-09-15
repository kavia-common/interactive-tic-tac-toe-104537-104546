import { render, screen } from '@testing-library/react';
import App from './App';

test('renders tic-tac-toe title', () => {
  render(<App />);
  const el = screen.getByText(/Play Tic-Tac-Toe/i);
  expect(el).toBeInTheDocument();
});
