import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../hooks/useTheme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('useTheme', () => {
  it('defaults to light when localStorage has no value', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('reads saved theme from localStorage on mount', () => {
    localStorage.setItem('brainx-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles from light to dark and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('brainx-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles from dark back to light and removes dark class', () => {
    localStorage.setItem('brainx-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('brainx-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
