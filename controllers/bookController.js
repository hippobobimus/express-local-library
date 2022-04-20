import Book from '../models/book.js';
import Author from '../models/author.js';
import Genre from '../models/genre.js';
import BookInstance from '../models/bookinstance.js';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';

const index = async (req, res, next) => {
  let bookCount;
  let bookInstanceCount;
  let bookInstanceAvailableCount;
  let authorCount;
  let genreCount;

  try {
    [
      bookCount,
      bookInstanceCount,
      bookInstanceAvailableCount,
      authorCount,
      genreCount,
    ] = await Promise.all([
      Book.countDocuments({}),
      BookInstance.countDocuments({}),
      BookInstance.countDocuments({ status: 'Available' }),
      Author.countDocuments({}),
      Genre.countDocuments({}),
    ]);
  } catch (error) {
    return next(error);
  }

  return res.render('index', {
    title: 'Local Library Home',
    data: {
      bookCount,
      bookInstanceCount,
      bookInstanceAvailableCount,
      authorCount,
      genreCount,
    },
  });
};

// Display list of all Books.
const bookList = async (req, res) => {
  let books;
  try {
    books = await Book.find({}, 'title author')
      .sort({ title: 1 })
      .populate('author');
  } catch (error) {
    return next(error);
  }

  return res.render('booklist', { title: 'Book List', bookList: books });
};

// Display detail page for a specific Book.
const bookDetail = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const e = new Error('Invalid book id');
    e.status = 404;
    return next(e);
  }

  let book;
  let bookInstances;
  try {
    [book, bookInstances] = await Promise.all([
      Book.findById(req.params.id).populate('author').populate('genre'),
      BookInstance.find({ book: req.params.id }),
    ]);
  } catch (error) {
    return next(error);
  }

  if (book === null) {
    const e = new Error('Book not found');
    e.status = 404;
    return next(e);
  }

  return res.render('bookdetail', { title: book.title, book, bookInstances });
};

// Display Book create form on GET.
const bookCreateGet = async (req, res, next) => {
  let authors;
  let genres;
  try {
    [authors, genres] = await Promise.all([Author.find(), Genre.find()]);
  } catch (error) {
    return next(error);
  }

  return res.render('bookform', { title: 'Create Book', authors, genres });
};

// Handle Book create on POST.
const bookCreatePost = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },

  // Validate and sanitize fields.
  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      let authors;
      let genres;
      try {
        [authors, genres] = await Promise.all([Author.find(), Genre.find()]);
      } catch (error) {
        return next(error);
      }

      // Mark our selected genres as checked.
      for (let i = 0; i < genres.length; i += 1) {
        if (book.genre.includes(genres[i]._id)) {
          genres[i].checked = 'true';
        }
      }

      return res.render('bookform', {
        title: 'Create Book',
        authors: authors,
        genres: genres,
        book: book,
        errors: errors.array(),
      });
    }

    // Data from form is valid. Save book.
    try {
      await book.save();
    } catch (error) {
      return next(error);
    }

    // successful - redirect to new book record.
    return res.redirect(book.url);
  },
];

// Display Book delete form on GET.
const bookDeleteGet = async (req, res, next) => {
  let book;
  let bookInstances;
  try {
    [book, bookInstances] = await Promise.all([
      Book.findById(req.params.id).populate('author'),
      BookInstance.find({ book: req.params.id }),
    ]);
  } catch (error) {
    return next(error);
  }

  if (book === null) {
    return res.redirect('/catalog/books');
  }

  return res.render('bookdelete', {
    title: 'Delete Book',
    book,
    bookInstances,
  });
};

// Handle Book delete on POST.
const bookDeletePost = async (req, res, next) => {
  let book;
  let bookInstances;
  try {
    [book, bookInstances] = await Promise.all([
      Book.findById(req.params.id).populate('author'),
      BookInstance.find({ book: req.params.id }),
    ]);
  } catch (error) {
    return next(error);
  }

  if (bookInstances.length > 0) {
    return res.render('bookdelete', {
      title: 'Delete Book',
      book,
      bookInstances,
    });
  }

  try {
    await Book.findByIdAndDelete(req.params.id);
  } catch (error) {
    return next(error);
  }

  return res.redirect('/catalog/books');
};

// Display Book update form on GET.
const bookUpdateGet = async (req, res, next) => {
  let book;
  let authors;
  let genres;
  try {
    [book, authors, genres] = await Promise.all([
      Book.findById(req.params.id).populate('author').populate('genre'),
      Author.find(),
      Genre.find(),
    ]);
  } catch (error) {
    return next(error);
  }

  if (book === null) {
    let error = new Error('Book not found');
    error.status = '404';
    return next(error);
  }

  // Mark selected genres as checked.
  genres.forEach((g) => {
    g.checked = book.genre.some((item) => item._id.equals(g._id));
  });

  return res.render('bookform', { title: 'Update Book', authors, genres, book });
};

// Handle Book update on POST.
const bookUpdatePost = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },

  // Validate and sanitize fields.
  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      let authors;
      let genres;
      try {
        [authors, genres] = await Promise.all([Author.find(), Genre.find()]);
      } catch (error) {
        return next(error);
      }

      // Mark our selected genres as checked.
      for (let i = 0; i < genres.length; i += 1) {
        if (book.genre.includes(genres[i]._id)) {
          genres[i].checked = 'true';
        }
      }

      return res.render('bookform', {
        title: 'Update Book',
        authors,
        genres,
        book,
        errors: errors.array(),
      });
    }

    // Data from form is valid. Update book.
    try {
      await Book.findByIdAndUpdate(req.params.id, book);
    } catch (error) {
      return next(error);
    }

    // successful - redirect to new book record.
    return res.redirect(book.url);
  },
];

export default {
  index,
  bookList,
  bookDetail,
  bookCreateGet,
  bookCreatePost,
  bookDeleteGet,
  bookDeletePost,
  bookUpdateGet,
  bookUpdatePost,
};
