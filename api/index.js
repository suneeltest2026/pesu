'use strict';
/* Vercel serverless entry point: every request is rewritten here by
   vercel.json and handed to the same Express app that runs standalone. */
module.exports = require('../server');
