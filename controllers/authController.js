const User = require('../models/userModel');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const argon = require('argon2');
const sendTokenByEmail = require('../utils/email');

const signToken = function (payload) {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendTokenViaCookie = (res, user) => {
  const token = signToken({ id: user._id });
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  return res.status(201).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passawordConfirm: req.body.passawordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });

    // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, {
    //   expiresIn: process.env.JWT_EXPIRES_IN,
    // });
    createAndSendTokenViaCookie(res, newUser);
  } catch (err) {
    return next(new AppError(err.message, 400, err));
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if the email and the password exist else send error
    if (!email || !password)
      return next(
        new AppError('Please provide email and password.', 400, {
          error: 'No email or password.',
        }),
      );
    // 2. If email and passwd exist then check if they are correct.
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.checkPasswordsIsSame(user.password, password)))
      return next(
        new AppError('Incorrect email or password', 401, {
          error: 'Failed to login.',
        }),
      );

    // If they are ok, send the response with the JWT token.
    createAndSendTokenViaCookie(res, user);
  } catch (err) {
    return next(new AppError('Error logging in', 404, err));
  }
};

const protect = async (req, res, next) => {
  try {
    // 1. Checking if the token exists in the header and storing it into a variable.
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) throw new Error('You are not logged in');

    // 2. Verifying if the token is valid.
    // const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log(decoded);

    // 3. Check if the user exists
    const currentUser = await User.findById({ _id: decoded.id });
    if (!currentUser)
      return next(
        new AppError('User does not exist. Please sign up.', 401, {
          status: 401,
          message: 'No existing user.',
        }),
      );

    // 4. Check if user has changed password.
    if (currentUser.changedPasswordsAfter(decoded.iat))
      return next(
        new AppError('Password has been changed. Please login again.'),
        401,
        {
          status: 401,
          message: 'Password has been changed.',
        },
      );
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError(err.message, 401, err));
  }
};

const restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to delete this tour.', 403, {
          status: 403,
          message: 'Forbidden action',
        }),
      );
    next();
  };
};

const forgotPassword = async (req, res, next) => {
  try {
    // 1. Get user based on POSTed request.
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return next(
        new AppError('No user found', 404, {
          status: 'error',
          message: 'No user found',
        }),
      );
    // 2a. Send  a random token to the email of the user.
    const resetToken = user.createPasswordResetToken();
    // 2b.Save the document
    await user.save({ validateModifiedOnly: false });
    // Send back as email.
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset_password/${resetToken}`;

    const message = `Forgot password? Click the below URL:${resetURL}.`;
    try {
      await sendTokenByEmail({
        email: user.email,
        subject: 'Your password reset token(valid for 10 mins)',
        message,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateModifiedOnly: false });
      return next(
        new AppError('There was an error sending the email.', 500, {
          message: err.message,
          stack: err.stack,
        }),
      );
    }

    res.status(200).json({
      status: 200,
      message: 'Token sent to email',
    });
  } catch (err) {
    return next(new AppError(err.message, 404, err));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    // 1. Get the user based on the token.
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    // 2. If the token has not expired, and there is user, set the new password.
    if (!user)
      return next(
        new AppError(
          'Token is invalid or expired',
          400,
          new Error('Token is invalid or expired'),
        ),
      );
    console.log(user);
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Saving the updates.
    await user.save();
    // 3. Update the changedPasswordAt property for the user. This is done in the pre("save") middleware.

    // 4. Log the user in.(send the JWT)
    createAndSendTokenViaCookie(res, user);
  } catch (err) {
    return next(
      new AppError(err.message, 404, {
        message: err.message,
        stack: err.stack,
      }),
    );
  }
};

const updatePassword = async (req, res, next) => {
  try {
    // const user = await User.findOne({ email: req.body.email });
    const user = await User.findById(req.user.id).select('+password');
    if (!user)
      return next(
        new AppError('User does not exist', 404, {
          status: 401,
          message: 'No existing user.',
        }),
      );
    // const hashedPassword = await argon.hash(req.body.password, 12);
    if (
      await user.checkPasswordsIsSame(user.password, req.body.passwordCurrent)
    ) {
      // if (hashedPassword === user.password) {
      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;
      await user.save();
      createAndSendTokenViaCookie(res, user);
    } else {
      return next(
        new AppError('Invalid password', 401, {
          status: 'fail',
          message: 'Invalid password',
        }),
      );
    }
  } catch (err) {
    return next(
      new AppError(err.message, 404, {
        message: err.message,
        stack: err.stack,
      }),
    );
  }
};

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
};
