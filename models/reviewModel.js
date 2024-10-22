const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  // {
  //   toJSON: { virtuals: true },
  //   toObject: { virtuals: true },
  // },
);

// reviewSchema.pre('save', function (next) {
//   this.createdAt = Date.now();
//   next();
// });

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Populating user and tour fields
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name price ratingsAvg guides',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRatings: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAvg: stats[0].avgRatings,
      ratingsQuantity: stats[0].nRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAvg: 0,
      ratingsQuantity: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});
// reviewSchema.pre(/^findOne/, async function (next) {
//   console.log('in pre', this);
// });

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   console.log(this);
//   const r = await this.findOne();
//   console.log('r', r);
// });

reviewSchema.post(/^findOne/, async (docs) => {
  console.log(docs);
  if (docs) await docs.constructor.calcAverageRatings(docs.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
