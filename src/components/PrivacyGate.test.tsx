import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrivacyGate } from './PrivacyGate';

describe('PrivacyGate Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders lock screen when not unlocked', () => {
    render(
      <PrivacyGate>
        <div>Tajny feed ekipy</div>
      </PrivacyGate>
    );

    expect(screen.getByText('Strefa prywatna ekipy')).toBeInTheDocument();
    expect(screen.queryByText('Tajny feed ekipy')).not.toBeInTheDocument();
  });

  it('unlocks and renders children with correct passcode', () => {
    render(
      <PrivacyGate>
        <div>Tajny feed ekipy</div>
      </PrivacyGate>
    );

    const input = screen.getByPlaceholderText('Wpisz tajny kod...');
    fireEvent.change(input, { target: { value: 'beme2026' } });

    fireEvent.click(screen.getByText('Odblokuj dostęp'));

    expect(screen.getByText('Tajny feed ekipy')).toBeInTheDocument();
    expect(localStorage.getItem('beme_group_unlocked')).toBe('true');
  });

  it('shows error on invalid passcode', () => {
    render(
      <PrivacyGate>
        <div>Tajny feed ekipy</div>
      </PrivacyGate>
    );

    const input = screen.getByPlaceholderText('Wpisz tajny kod...');
    fireEvent.change(input, { target: { value: 'zly_kod' } });

    fireEvent.click(screen.getByText('Odblokuj dostęp'));

    expect(screen.getByText(/Nieprawidłowy kod/)).toBeInTheDocument();
    expect(screen.queryByText('Tajny feed ekipy')).not.toBeInTheDocument();
  });

  it('renders children immediately if already unlocked in localStorage', () => {
    localStorage.setItem('beme_group_unlocked', 'true');

    render(
      <PrivacyGate>
        <div>Tajny feed ekipy</div>
      </PrivacyGate>
    );

    expect(screen.getByText('Tajny feed ekipy')).toBeInTheDocument();
  });
});
