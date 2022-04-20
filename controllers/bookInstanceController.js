import BookInstance from '../models/bookinstance.js';
import Book from '../models/book.js';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';

// Display list of all BookInstances.
const bookInstanceList = async (req, res, next) => {
  let bookInstances;
  try {
    bookInstances = await BookInstance.find().populate('book');
  } catch (error) {
    return next(error);
  }

  return res.render('bookinstancelist', {
    title: 'Book Instance List',
    bookInstanceList: bookInstances,
  });
};

// Display detail page for a specific BookInstance.
const bookInstanceDetail = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const e = new Error('Invalid book instance id');
    e.status = 404;
    return next(e);
  }

  let bookInstance;
  try {
    bookInstance = await BookInstance.findById(req.params.id).populate('book');
  } catch (error) {
    return next(error);
  }

  if (bookInstance === null) {
    const e = new Error('Book instance not found');
    e.status = 404;
    return next(e);
  }

  return res.render('bookinstancedetail', {
    title: 'Copy: ' + bookInstance.book.title,
    bookInstance,
  });
};

// Display BookInstance create form on GET.
const bookInstanceCreateGet = async (req, res, next) => {
  let bookList;
  try {
    bookList = await Book.find({}, 'title');
  } catch (error) {
    return next(error);
  }

  return res.render('bookinstanceform', {
    title: 'Create BookInstance',
    bookList,
  });
};

// Handle BookInstance create on POST.
const bookInstanceCreatePost = [
  // Validate and sanitize fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('dueBack', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.dueBack,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      let bookList;
      try {
        bookList = await Book.find({}, 'title');
      } catch (error) {
        return next(error);
      }

      // Successful, so render.
      return res.render('bookinstanceform', {
        title: 'Create Book Instance',
        bookList,
        selectedBook: bookInstance.book._id,
        errors: errors.array(),
        bookInstance: bookInstance,
      });
    }

    // Data from form is valid.
    try {
      await bookInstance.save();
    } catch (error) {
      return next(error);
    }

    // Successful - redirect to new record.
    return res.redirect(bookInstance.url);
  },
];

// Display BookInstance delete form on GET.
const bookInstanceDeleteGet = async (req, res, next) => {
  let bookInstance;
  try {
    bookInstance = await BookInstance.findById(req.params.id).populate('book');
  } catch (error) {
    return next(error);
  }

  console.log(bookInstance.book.title);

  if (bookInstance === null) {
    return res.redirect('/catalog/bookinstances');
  }

  return res.render('bookinstancedelete', {
    title: 'Delete Book Instance',
    bookInstance,
  });
};

// Handle BookInstance delete on POST.
const bookInstanceDeletePost = async (req, res, next) => {
  try {
    await BookInstance.findByIdAndDelete(req.params.id);
  } catch (error) {
    return next(error);
  }

  return res.redirect('/catalog/bookinstances');
};

// Display BookInstance update form on GET.
const bookInstanceUpdateGet = async (req, res, next) => {
  let bookInstance;
  let bookList;
  try {
    [bookInstance, bookList] = await Promise.all([
      BookInstance.findById(req.params.id),
      Book.find({}, 'title'),
    ]);
  } catch (error) {
    return next(error);
  }

  return res.render('bookinstanceform', {
    title: 'Update Book Instance',
    bookList,
    bookInstance,
    selectedBook: bookInstance.book._id,
  });
};

// Handle BookInstance update on POST.
const bookInstanceUpdatePost = [
  // Validate and sanitize fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('dueBack', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.dueBack,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      let bookList;
      try {
        bookList = await Book.find({}, 'title');
      } catch (error) {
        return next(error);
      }

      // Successful, so render.
      return res.render('bookinstanceform', {
        title: 'Update Book Instance',
        bookList,
        selectedBook: bookInstance.book._id,
        errors: errors.array(),
        bookInstance: bookInstance,
      });
    }

    // Data from form is valid.
    try {
      await BookInstance.findByIdAndUpdate(req.params.id, bookInstance);
    } catch (error) {
      return next(error);
    }

    // Successful - redirect to new record.
    return res.redirect(bookInstance.url);
  },
];

export default {
  bookInstanceList,
  bookInstanceDetail,
  bookInstanceCreateGet,
  bookInstanceCreatePost,
  bookInstanceDeleteGet,
  bookInstanceDeletePost,
  bookInstanceUpdateGet,
  bookInstanceUpdatePost,
};
