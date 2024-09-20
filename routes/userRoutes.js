const express = require('express');

const {
  getAllUsers,
  getUser,
  updateUser,
  createUser,
  deleteUser,
  updateMe,
  deleteMe,
} = require('../controllers/userControllers');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} = require('../controllers/authController');

const router = express.Router();

router.route('/').get(getAllUsers).post(createUser);

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/forgot_password').post(forgotPassword);
router.route('/reset_password/:token').patch(resetPassword);
router.route('/update_password').patch(protect, updatePassword);
router.route('/update_profile').patch(protect, updateMe);
router.route('/delete_me').delete(protect, deleteMe);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
