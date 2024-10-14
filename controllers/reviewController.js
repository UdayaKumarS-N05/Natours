const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const getAllReviews = async (req, res, next) => {
  try {
    // const review = await Review.findById(req.params.id);
    let filter;
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const review = await Review.find(filter);

    res.status(200).json({
      status: 'success',
      results: review.length,
      data: {
        review,
      },
    });
  } catch (err) {
    return next(new AppError(err.message, 401, err));
  }
};

const createReview = async (req, res, next) => {
  try {
    // const newReview = await Review.create({
    //   review: req.body.review,
    //   rating: req.body.rating,
    //   tour: req.params.tourId,
    //   user: req.user._id,
    // });
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user._id;
    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        review: newReview,
      },
    });
  } catch (err) {
    return next(new AppError(err.message, 401, err));
  }
};

const deleteReview = factory.deleteOne(Review);
const updateReview = factory.updateOne(Review);

module.exports = { getAllReviews, createReview, deleteReview, updateReview };
