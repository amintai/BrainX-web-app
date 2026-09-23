/**
 * validate({ body?, query?, params? }) parses the named request parts with
 * their Zod schemas and stores the results on req.validated. Controllers
 * must read only req.validated — Express 5 makes req.query a read-only
 * getter, so it cannot be reassigned in place.
 */
export function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      const validated = {};
      if (schemas.body) validated.body = schemas.body.parse(req.body);
      if (schemas.query) validated.query = schemas.query.parse(req.query);
      if (schemas.params) validated.params = schemas.params.parse(req.params);
      req.validated = validated;
      next();
    } catch (err) {
      next(err);
    }
  };
}
