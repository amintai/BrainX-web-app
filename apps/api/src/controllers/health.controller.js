import { getHealth } from '../services/health.service.js';
import { sendSuccess } from '../utils/response.js';

export function getHealthController(req, res) {
  sendSuccess(res, getHealth());
}
