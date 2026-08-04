import Joi from 'joi';

export const createTestCaseSchema = Joi.object({
  input: Joi.string().required(),
  expectedOutput: Joi.string().required(),
  isHidden: Joi.boolean().default(false),
  order: Joi.number().integer().min(0).default(0),
});
