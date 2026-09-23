import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, target: ValidationTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fields = Object.fromEntries(
        (result.error as ZodError).errors.map((e) => [e.path.join('.'), e.message]),
      );
      sendError(res, { code: 'VALIDATION_ERROR', message: 'Validation failed' }, 422, fields);
      return;
    }

    req[target] = result.data;
    next();
  };
