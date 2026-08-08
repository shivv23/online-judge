import Joi from 'joi';

export const compileRunSchema = Joi.object({
  language: Joi.string().valid('cpp', 'c', 'python', 'js', 'java').required(),
  code: Joi.string().min(1).max(50000).required(),
  input: Joi.string().max(100000).allow(''),
});
