import Joi from 'joi';

export const createSubmissionSchema = Joi.object({
  problemId: Joi.string().required(),
  language: Joi.string().valid('cpp', 'c', 'python', 'js', 'java').required(),
  code: Joi.string().min(1).max(50000).required(),
});
