import { describe, it, expect, vi } from 'vitest';
import { sendSuccess } from './response.js';

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('sendSuccess', () => {
  it('writes the success envelope with the default 200 status', () => {
    const res = mockRes();
    sendSuccess(res, { foo: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { foo: 1 } });
  });

  it('honours a custom status', () => {
    const res = mockRes();
    sendSuccess(res, { id: 'x' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
