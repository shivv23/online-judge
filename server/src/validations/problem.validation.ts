import Joi from 'joi';

export const createProblemSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  statement: Joi.string().min(10).required(),
  inputFormat: Joi.string().required(),
  outputFormat: Joi.string().required(),
  constraints: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).default([]),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
  sampleInput: Joi.string().required(),
  sampleOutput: Joi.string().required(),
  timeLimit: Joi.number().integer().min(100).max(10000).default(2000),
  memoryLimit: Joi.number().integer().min(16).max(1024).default(256),
});

export const updateProblemSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  statement: Joi.string().min(10),
  inputFormat: Joi.string(),
  outputFormat: Joi.string(),
  constraints: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard'),
  sampleInput: Joi.string(),
  sampleOutput: Joi.string(),
  timeLimit: Joi.number().integer().min(100).max(10000),
  memoryLimit: Joi.number().integer().min(16).max(1024),
}).min(1);
