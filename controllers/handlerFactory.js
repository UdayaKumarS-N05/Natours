const AppError = require('../utils/appError');

exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document)
      throw new Error(
        `No document with "${req.params.id}" exist. Please try valid ID.`,
      );
    return res.status(204).json({
      status: 'success',
      message: `Document deleted successfully!`,
      data: null,
    });
  } catch (err) {
    return next(new AppError(err.message, 404, err));
  }
};

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const updatedDocument = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 'success',
      message: `Document updated successfully!`,
      data: { data: updatedDocument },
    });
  } catch (err) {
    return next(new AppError(err.message, 404, err));
  }
};

exports.createOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    return next(new AppError(`Item could not be created.`, 404, err));
  }
};

exports.getOne = (Model, populateOptns) => async (req, res, next) => {
  try {
    // const { id } = req.params;
    const document = await Model.findById(req.params.id)
      .populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
      })
      .populate({
        path: 'reviews',
      });

    return res.status(200).json({
      status: 'success',
      totalResults: document.length,
      data: {
        document,
      },
    });
  } catch (err) {
    return next(
      new AppError(
        `No document with "${req.params.id}" does not exist. Please try valid ID.`,
        404,
        err,
      ),
    );
  }
};
