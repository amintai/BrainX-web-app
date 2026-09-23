import { getCurrentUser } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export function getMeController(req, res) {
  sendSuccess(res, getCurrentUser(req.user));
}
