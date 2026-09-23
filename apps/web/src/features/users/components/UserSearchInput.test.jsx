import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserSearchInput } from './UserSearchInput.jsx';

describe('UserSearchInput', () => {
  it('calls onChange with the typed value (controlled)', () => {
    const onChange = vi.fn();
    render(<UserSearchInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'marcus' } });
    expect(onChange).toHaveBeenCalledWith('marcus');
  });
});
