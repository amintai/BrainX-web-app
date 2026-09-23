import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { ActivityFeed } from './ActivityFeed.jsx';

describe('ActivityFeed', () => {
  it('renders the 4 fixture entries in order with actor, description, time, and category', async () => {
    renderWithProviders(<ActivityFeed />, { authStatus: 'authenticated' });

    await screen.findByText('Elena Rostova');
    const names = ['Elena Rostova', 'Marcus Chen', 'System Daemon', 'Sarah Jenkins'];
    const positions = names.map((name) => document.body.innerHTML.indexOf(name));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));

    expect(screen.getByText('SecOps')).toBeInTheDocument();
    expect(screen.getAllByText(/minutes ago/).length).toBeGreaterThan(0);
  });

  it('never uses dangerouslySetInnerHTML', () => {
    const source = fs.readFileSync(
      path.resolve(import.meta.dirname, './ActivityFeedItem.jsx'),
      'utf8',
    );
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });
});
