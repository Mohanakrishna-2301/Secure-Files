const Plan = require('../models/Plan');

// @desc   Get all plans
// @route  GET /api/plans
// @access Public (or protected if you want)
const getPlans = async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort('price');
  res.json({ success: true, data: plans });
};

// @desc   Get single plan
// @route  GET /api/plans/:id
// @access Public
const getPlan = async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  res.json({ success: true, data: plan });
};

// @desc   Create new plan
// @route  POST /api/plans
// @access Admin
const createPlan = async (req, res) => {
  const plan = await Plan.create(req.body);
  res.status(201).json({ success: true, data: plan });
};

// @desc   Update plan
// @route  PUT /api/plans/:id
// @access Admin
const updatePlan = async (req, res) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  res.json({ success: true, data: plan });
};

// @desc   Delete or deactivate plan
// @route  DELETE /api/plans/:id
// @access Admin
const deletePlan = async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  
  // Soft delete / deactivate
  plan.isActive = false;
  await plan.save();
  
  res.json({ success: true, message: 'Plan deactivated successfully' });
};

module.exports = { getPlans, getPlan, createPlan, updatePlan, deletePlan };
