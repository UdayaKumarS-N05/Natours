const express = require('express');
// const fs = require('fs');
// //Reading file once
// const tours = JSON.parse(fs.readFileSync(`./dev-data/data/tours-simple.json`));

const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getTopFiveCheapest,
  getTop3BestRated,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../controllers/tourControllers');

const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();
router.use('/:tourId/reviews', reviewRouter);
router.route('/').get(protect, getAllTours).post(createTour);
router.route('/top-5-cheapest').get(getTopFiveCheapest, getAllTours);
router.route('/top-3-best-rated').get(getTop3BestRated, getAllTours);
router.route('/stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(getDistances);
router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);
module.exports = router;
