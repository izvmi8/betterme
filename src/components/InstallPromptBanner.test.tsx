import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstallPromptBanner } from './InstallPromptBanner';

describe('InstallPromptBanner Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders install banner when not in standalone mode', () => {
    render(<InstallPromptBanner />);
    expect(screen.getByText('Dodaj BeMe na pulpit')).toBeInTheDocument();
  });

  it('dismisses banner and saves to sessionStorage', () => {
    render(<InstallPromptBanner />);
    const dismissBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText('Dodaj BeMe na pulpit')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('beme_banner_dismissed')).toBe('true');
  });
});
