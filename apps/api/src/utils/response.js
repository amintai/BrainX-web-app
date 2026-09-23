/**
 * Sends the standard success envelope: { success: true, data }.
 */
export function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}
