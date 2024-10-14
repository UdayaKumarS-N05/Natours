const mongoose = require('mongoose');
const validator = require('validator');
const argon = require('argon2');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name.'],
    },
    email: {
      type: String,
      required: [true, 'Please tell us your email address.'],
      unique: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email.',
      },
    },
    photo: {
      type: String,
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'user', 'guide', 'lead-guide'],
        message:
          "Only 'admin', 'user', 'guide', 'lead-guide' are the only users possible",
      },
      default: 'user',
    },
    password: {
      type: String,
      // validator: [validator.isStrongPassword, 'Password not strong enough'],
      minlength: 8,
      required: [true, 'Please enter your password.'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords do not match',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  // {
  //   toJSON: { virtuals: true },
  //   toObject: { virtuals: true },
  // },
);

userSchema.methods.checkPasswordsIsSame = async function (
  candidatePassword,
  userPassword,
) {
  return await argon.verify(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordsAfter = function (JWTTimeStamp) {
  console.log('in changedPasswordsAfter');
  if (this.passwordChangedAt) {
    console.log('in if changedPasswordsAfter');
    const passwordChangedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(passwordChangedTimeStamp, JWTTimeStamp);
    return JWTTimeStamp < passwordChangedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function (next) {
  // 1. Check if the password is modified.
  if (!this.isModified('password')) return next();
  // 2. encrypt the password.
  this.password = await argon.hash(this.password, 12);
  // 3.removing the password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this keyword points to current query
  this.find({ active: { $ne: false } });
  next();
});
const User = mongoose.model('User', userSchema);

module.exports = User;
