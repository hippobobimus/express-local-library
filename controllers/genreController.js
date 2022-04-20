import Genre from '../models/genre.js';
import Book from '../models/book.js';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';

// Display list of all Genres.
const genreList = async (req, res, next) => {
  let genres;
  try {
    genres = await Genre.find({}).sort({ name: 'ascending' });
  } catch (error) {
    return next(error);
  }

  return res.render('genrelist', { title: 'Genre List', genreList: genres });
};

// Display detail page for a specific Genre.
const genreDetail = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const e = new Error('Invalid genre id');
    e.status = 404;
    return next(e);
  }

  let genre;
  let genreBooks;
  try {
    [genre, genreBooks] = await Promise.all([
      Genre.findById(req.params.id),
      Book.find({ genre: req.params.id }),
    ]);
  } catch (error) {
    return next(error);
  }

  if (genre === null) {
    const e = new Error('Genre not found');
    e.status = 404;
    return next(e);
  }

  return res.render('genredetail', {
    title: 'Genre Detail',
    genre,
    genreBooks,
  });
};

// Display Genre create form on GET.
const genreCreateGet = (req, res) => {
  return res.render('genreform', { title: 'Create Genre' });
};

// Handle Genre create on POST.
const genreCreatePost = [
  // Validate and sanitise the name field.
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitisation.
  async (req, res, next) => {
    // validation errors
    const errors = validationResult(req);

    // new genre with sanitised data
    const genre = new Genre({
      name: req.body.name,
    });

    if (!errors.isEmpty()) {
      return res.render('genreform', {
        title: 'Create Genre',
        genre,
        errors: errors.array(),
      });
    }

    let foundGenre;
    try {
      foundGenre = await Genre.findOne({ name: req.body.name });
    } catch (error) {
      return next(error);
    }

    if (foundGenre) {
      // genre already exists
      return res.redirect(foundGenre.url);
    }

    try {
      await genre.save();
    } catch (error) {
      return next(error);
    }

    return res.redirect(genre.url);
  },
];

// Display Genre delete form on GET.
const genreDeleteGet = async (req, res, next) => {
  let genre;
  let books;
  try {
    [genre, books] = await Promise.all([
      Genre.findById(req.params.id),
      Book.find({ genre: req.params.id }),
    ]);
  } catch (error) {
    return next(error);
  }

  if (genre === null) {
    return res.redirect('/catalog/genres');
  }

  return res.render('genredelete', { title: 'Delete Genre', genre, books });
};

// Handle Genre delete on POST.
const genreDeletePost = async (req, res, next) => {
  let genre;
  let books;
  try {
    [genre, books] = await Promise.all([
      Genre.findById(req.params.id),
      Book.find({ genre: req.params.id }),
    ]);
  } catch (error) {
    return next(error);
  }

  if (books.length > 0) {
    return res.render('genredelete', { title: 'Delete Genre', genre, books });
  }

  try {
    await Genre.findByIdAndDelete(req.params.id);
  } catch (error) {
    return next(error);
  }

  return res.redirect('/catalog/genres');
};

// Display Genre update form on GET.
const genreUpdateGet = async (req, res, next) => {
  let genre;
  try {
    genre = await Genre.findById(req.params.id);
  } catch (error) {
    return next(error);
  }

  return res.render('genreform', { title: 'Create Genre', genre });
};

// Handle Genre update on POST.
const genreUpdatePost = [
  // Validate and sanitise the name field.
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitisation.
  async (req, res, next) => {
    // validation errors
    const errors = validationResult(req);

    // updated genre with sanitised data
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      return res.render('genreform', {
        title: 'Create Genre',
        genre,
        errors: errors.array(),
      });
    }

    try {
      await Genre.findByIdAndUpdate(req.params.id, genre);
    } catch (error) {
      return next(error);
    }

    return res.redirect(genre.url);
  },
];

export default {
  genreList,
  genreDetail,
  genreCreateGet,
  genreCreatePost,
  genreDeleteGet,
  genreDeletePost,
  genreUpdateGet,
  genreUpdatePost,
};
