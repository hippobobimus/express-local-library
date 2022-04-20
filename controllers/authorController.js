import Author from '../models/author.js';
import Book from '../models/book.js';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';

// Display list of all Authors.
const authorList = async (req, res, next) => {
  let authors;
  try {
    authors = await Author.find().sort([['lastName', 'ascending']]);
  } catch (error) {
    return next(error);
  }

  return res.render('authorlist', {
    title: 'Author List',
    authorList: authors,
  });
};

// Display detail page for a specific Author.
const authorDetail = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const e = new Error('Invalid author id');
    e.status = 404;
    return next(e);
  }

  let author;
  let books;
  try {
    [author, books] = await Promise.all([
      Author.findById(req.params.id),
      Book.find({ author: req.params.id }, 'title summary'),
    ]);
  } catch (error) {
    return next(error);
  }

  if (author === null) {
    const e = new Error('Author not found');
    e.status = 404;
    return next(e);
  }

  return res.render('authordetail', { title: author.name, author, books });
};

// Display Author create form on GET.
const authorCreateGet = (req, res) => {
  res.render('authorform', { title: 'Create Author' });
};

// Handle Author create on POST.
const authorCreatePost = [
  // Validate and sanitize fields.
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  body('dateOfBirth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('dateOfDeath', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      return res.render('authorform', {
        title: 'Create Author',
        author: req.body,
        errors: errors.array(),
      });
    }

    // Data from form is valid.

    // Create an Author object with escaped and trimmed data.
    const author = new Author({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: req.body.dateOfBirth,
      dateOfDeath: req.body.dateOfDeath,
    });

    try {
      await author.save();
    } catch (error) {
      return next(error);
    }

    // Successful - redirect to new author record.
    return res.redirect(author.url);
  },
];

// Display Author delete form on GET.
const authorDeleteGet = async (req, res, next) => {
  let author;
  let authorBooks;
  try {
    [author, authorBooks] = await Promise.all([
      Author.findById(req.params.id),
      Book.find({ author: req.params.id }),
    ]);
  } catch (error) {
    return next(error);
  }

  if (author === null) {
    return res.redirect('/catalog/authors');
  }

  return res.render('authordelete', {
    title: 'Delete Author',
    author,
    authorBooks,
  });
};

// Handle Author delete on POST.
const authorDeletePost = async (req, res, next) => {
  let author;
  let authorBooks;
  try {
    [author, authorBooks] = await Promise.all([
      Author.findById(req.params.id),
      Book.find({ author: req.params.id }),
    ]);
  } catch (error) {
    return next(error);
  }

  if (authorBooks.length > 0) {
    return res.render('authordelete', {
      title: 'Delete Author',
      author,
      authorBooks,
    });
  }

  try {
    await Author.findByIdAndDelete(req.body.authorid);
  } catch (error) {
    return next(error);
  }

  return res.redirect('/catalog/authors');
};

// Display Author update form on GET.
const authorUpdateGet = async (req, res, next) => {
  let author;
  try {
    author = await Author.findById(req.params.id);
  } catch (error) {
    return next(error);
  }

  return res.render('authorform', { title: 'Update Author', author });
};

// Handle Author update on POST.
const authorUpdatePost = [
  // Validate and sanitize fields.
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  body('dateOfBirth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('dateOfDeath', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create an Author object with escaped and trimmed data.
    const author = new Author({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: req.body.dateOfBirth,
      dateOfDeath: req.body.dateOfDeath,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      return res.render('authorform', {
        title: 'Update Author',
        author,
        errors: errors.array(),
      });
    }

    // Data from form is valid.

    try {
      await Author.findByIdAndUpdate(req.params.id, author);
    } catch (error) {
      return next(error);
    }

    // Successful - redirect to updated author record.
    return res.redirect(author.url);
  },
];

export default {
  authorList,
  authorDetail,
  authorCreateGet,
  authorCreatePost,
  authorDeleteGet,
  authorDeletePost,
  authorUpdateGet,
  authorUpdatePost,
};
