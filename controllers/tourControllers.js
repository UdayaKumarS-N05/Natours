const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
/*// //Reading file once
// .we dont need this anymore since we are not using files as database.
// const tours = JSON.parse(fs.readFileSync(`./dev-data/data/tours-simple.json`));

// const checkBody = (req, res, next) => {
//   if (!req.body.name) {
//     return res.status(400).json({
//       status: 'failed',
//       message: 'Name missing.',
//     });
//   }
//   if (!req.body.price) {
//     return res.status(400).json({
//       status: 'failed',
//       message: 'Price missing',
//     });
//   }
//   next();
// };*/

const getTopFiveCheapest = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAvg,price';
  req.query.fields = 'name,price,ratingsAvg,summary,description';
  next();
};

const getTop3BestRated = (req, res, next) => {
  req.query.limit = 3;
  req.query.sort = '-ratingsAvg';
  req.query.fields = 'name,price,ratingsAvg,summary,description';
  next();
};

const getAllTours = async (req, res) => {
  // res.status(200).json({
  //   status: 'success',
  //   // results: tours.length,
  //   // data: {
  //   //   tours: tours,
  //   //   // can also be just "tours" since both values names are same . It is an ES6 feature.
  //   //   // if your are send data called "xData" then you should send tours:xData
  //   // },
  // });

  try {
    console.log(req.query);
    // const queryObj = { ...req.query };
    // console.log('req.query', queryObj);
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach((el) => delete queryObj[el]);

    // // Advanced filtering
    // // to filter out comparison operators
    // let queryStr = JSON.stringify(queryObj);
    // console.log('received query string', queryStr);
    // queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
    // console.log('clearing comparison operators', queryStr);
    // console.log('parsed string', JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));
    // console.log('query', query);

    // to sort
    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   query = query.sort(sortBy);
    // } else {
    //   query = query.sort('-createdAt');
    // }

    // field limiting
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   // projecting
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    // }

    // pagination
    // const page = Number(req.query.page) || 1;
    // const limit = Number(req.query.limit) || 100;
    // const skipValue = (page - 1) * limit;
    // query = query.skip(skipValue).limit(limit);

    // if (req.query.page) {
    //   if (skipValue >= (await Tour.countDocuments()))
    //     throw new Error('This page does not exist!');
    // }

    // Executing the query
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const allTours = await features.query;

    return res.status(200).json({
      status: 'success',
      totalResults: allTours.length,
      data: {
        tours: allTours,
      },
    });
  } catch (err) {
    return res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

const getTour = async (req, res, next) => {
  try {
    // const { id } = req.params;
    const tour = await Tour.findById(req.params.id)
      .populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
      })
      .populate({
        path: 'reviews',
      });

    return res.status(200).json({
      status: 'success',
      totalResults: tour.length,
      data: {
        tour,
      },
    });
  } catch (err) {
    return next(
      new AppError(
        `No tour with "${req.params.id}" does not exist. Please try valid ID.`,
        404,
        err,
      ),
    );
  }
};

const createTour = async (req, res, next) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    return next(new AppError(`Tour could not be created.`, 404, err));
  }
};

const updateTour = async (req, res, next) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // if (!updateTour) {
    //   return next(new AppError(`Error updating the tour.`, 404));
    // }

    res.status(200).json({
      status: 'success',
      data: {
        tour: updatedTour,
      },
    });
  } catch (err) {
    return next(new AppError('Error updating the tour.', 404, err));
  }
};

const deleteTour = async (req, res, next) => {
  /*// const id = Number(req.params.id);
  // let tour = tours.find((item) => item.id === id);
  // if (!tour) return res.status(404).send('Invalid ID');
  // // making changes to the tour object
  // // this replaces existing fields
  // newTours = tours.filter((item) => item.id !== id);
  // newTours.sort((a, b) => a.id - b.id);
  // fs.writeFile(
  //   `./dev-data/data/tours-simple.json`,
  //   JSON.stringify(newTours),
  //   (err) => {
  //     return res.status(204).json({
  //       status: 'success',
  //       data: null,
  //     });
  //   },
  // );*/

  try {
    const deletedTour = await Tour.findByIdAndDelete(req.params.id);
    if (!deletedTour)
      throw new Error(
        `No tour with "${req.params.id}" exist. Please try valid ID.`,
      );
    res.status(204).json({
      status: 'success',
      message: `Tour deleted successfully!`,
      data: null,
    });
  } catch (err) {
    return next(new AppError(err.message, 404, err));
  }
};

const getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      { $match: { ratingsAvg: { $gte: 4 } } },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingQuantity' },
          avgRating: { $avg: '$ratingsAvg' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { avgRating: 1, _id: 1 } },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

const getMonthlyPlan = async (req, res) => {
  try {
    const year = +req.params.year;
    const plan = await Tour.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTours: { $sum: 1 },
          tours: { $push: `$name` },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
          numTours: 1,
          tours: 1,
          month: 1,
        },
      },
      {
        $sort: { numTours: -1 },
      },
    ]);
    res.status(200).json({
      status: 'success',
      message: 'monthly plan',
      results: plan.length,
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

const getToursWithin = async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!distance) return next(new AppError('Please provide the distance'), 401);
  if (!lat || !lng)
    return next(
      new AppError('Please provide the co-ordinates in lat,lng format'),
      401,
    );
  if (!unit)
    return next(
      new AppError(
        'Please provide the unit of measurement. "mi" for miles and "km" for kilometers.',
      ),
      401,
    );
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  try {
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  } catch (err) {
    return next(new AppError(err.message, 404, err));
  }
};

const getDistances = async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(
      new AppError('Please provide the co-ordinates in lat,lng format'),
      401,
    );
  if (!unit)
    return next(
      new AppError(
        'Please provide the unit of measurement. "mi" for miles and "km" for kilometers.',
      ),
      401,
    );
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  try {
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        data: distances,
      },
    });
  } catch (err) {
    return next(new AppError(err.message, 404, err));
  }
};
module.exports = {
  getTopFiveCheapest,
  getDistances,
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getTop3BestRated,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
};
