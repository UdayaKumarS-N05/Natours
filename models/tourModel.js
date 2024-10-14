const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');

const toursScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minlength: [10, 'A tour should have 10 or more characters in the name.'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty rating.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: `Difficulty should be either 'easy','medium' or 'difficult'`,
      },
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    ratingsAvg: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message:
          'Discount amount {VALUE} cannot be greater than the tour price.',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image cover.'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: {
      type: [Date],
    },
    slug: {
      type: String,
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: {
          values: ['Point'],
          message: 'Only Point is a valid type.',
        },
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: {
            values: ['Point'],
            message: 'Only Point is a valid type.',
          },
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // This is referencing. Where only the IDs are stored in the parent docs.
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],

    // {
    //   toJSON: { virtuals: true },
    //   toObject :{virtuals:true},
    // }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// DOCUMUENT MIDDLEWARE : pre middleware function works on .save() and .create() hooks
toursScheme.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Indexing to improve performance.
toursScheme.index({ price: 1, ratingsAvg: -1 });
toursScheme.index({ slug: 1 });

// Virtual populate
toursScheme.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// For embedding guides(user) docs
// toursScheme.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(
//     async (id) => await User.findById({ _id: id }),
//   );
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// DOCUMUENT MIDDLEWARE : post middleware functions executes after all the pre middleware functions are executed.
// therfore we do not have access to the this keyword.
// toursScheme.post('save', function (doc, next) {
//   console.log('post this', this);
//   next();
// });

const Tour = mongoose.model('Tour', toursScheme);

module.exports = Tour;
