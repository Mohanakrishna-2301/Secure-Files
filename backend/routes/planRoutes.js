const express = require('express');
const router = express.Router();
const { getPlans, getPlan, createPlan, updatePlan, deletePlan } = require('../controllers/planController');
const protect = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware'); // you'll create this

router.route('/')
  .get(getPlans)
  .post(protect, isAdmin, createPlan);

router.route('/:id')
  .get(getPlan)
  .put(protect, isAdmin, updatePlan)
  .delete(protect, isAdmin, deletePlan);

module.exports = router;
