const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { protect, restrictTo } = require('./authController');
const factory = require('./handlerFactory');

// const jwt = require('jsonwebtoken');

const filterObj = (obj, ...args) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (args.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: 'success',
      totalResults: users.length,
      data: {
        users: users,
      },
    });
  } catch (err) {
    return next(new AppError('Error getting users', 400, err));
  }
};

const updateMe = async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'Use the reset password if you want to change password. In case you forgot the password use the forgot button',
        403,
        {
          status: 403,
          message: 'Forbidden action',
        },
      ),
    );

  try {
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 200,
      message: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    return next(new AppError(err.message, 401, err));
  }
};

const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(200).json({
      statusCode: 200,
      status: 'success',
      message: 'Your profile is deleted!',
    });
  } catch (err) {
    return next(new AppError(err.message, 401, err));
  }
};

// const getUser = (req, res) => {
//   return res.status(500).json({
//     status: 'error',
//     message: 'This route is still not created',
//   });
// };

// const createUser = factory.createOne(User);

const updateUser = factory.updateOne(User);
const deleteUser = factory.deleteOne(User);

module.exports = {
  getAllUsers,
  // getUser,
  updateUser,
  // createUser,
  deleteUser,
  updateMe,
  deleteMe,
};
