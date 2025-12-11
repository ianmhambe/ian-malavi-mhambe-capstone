const { AppError } = require('./errorHandler');

/**
 * Validation middleware factory
 * @param {Object} schema - Zod schema
 * @param {string} source - 'body', 'query', or 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new AppError('Validation failed', 400, errors);
      }

      // Replace with parsed/transformed data
      req[source] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { validate };
