import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SsoButtons } from './SsoButtons.jsx';
import { LoginFooter } from './LoginFooter.jsx';

describe('SsoButtons', () => {
  it('does nothing when clicked — no network call, no navigation', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('should not be called');
    });

    render(<SsoButtons />);
    fireEvent.click(screen.getByText('Google SSO'));
    fireEvent.click(screen.getByText('Microsoft'));

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('LoginFooter', () => {
  it('shows exactly 3 links separated by bullets, plus the TLS/SOC2 line', () => {
    render(<LoginFooter />);
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Support')).toBeInTheDocument();
    expect(screen.getAllByText('•')).toHaveLength(2);
    expect(screen.getByText('Encrypted via TLS 1.3 & SOC2 Type II Certified')).toBeInTheDocument();
  });
});
