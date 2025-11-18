const express = require('express');
const { getCategories, createCategory } = require('../controllers/categorycontroller.js');
const { body } = require('express-validator');
const auth = require('../middleware/auth.js');

const router = express.Router();

router.get('/', getCategories);
router.post('/', 
  auth,
  [body('name').notEmpty().withMessage('Category name is required')],
  createCategory
);

module.exports = router;