const express = require('express');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
router.route('/').get(getAllReviews);
router.route('/').post(protect, restrictTo('user'), createReview);
router.route('/:id').patch(protect, updateReview).delete(protect, deleteReview);

module.exports = router;
