const express = require('express');
const { v4: uuid } = require('uuid');
const { isWebUri } = require('valid-url'); // Got this idea from the solution
const logger = require('../logger');
const { bookmarks } = require('../store');

const booksmarkRouter = express.Router();
const bodyParser = express.json();

booksmarkRouter
  .route('/bookmarks')
  .get((req, res) => res.status(200).json(bookmarks))
  .post(bodyParser, (req, res) => {
    const {
      title,
      url,
      description,
      rating,
    } = req.body;
    if (!title || !url || !description || !rating) {
      logger.error('POST /bookmarks failed due to missing field');
      return res.status(400).send('Invalid data: missing field');
    }

    if (![1, 2, 3, 4, 5].includes(rating)) {
      logger.error(`POST /bookmarks failed due to invalid rating ${rating}`);
      return res.status(400).send('Invalid data: rating must be between 1 and 5');
    }

    if (!isWebUri(url)) {
      logger.error(`POST /bookmarks failed due to invalid url ${url}`);
      return res.status(400).send('Invalid data: url must be a valid web url');
    }

    const id = uuid();
    const newBookmark = {
      id,
      title,
      url,
      description,
      rating,
    };

    logger.info(`Bookmark with id ${id} created`);
    bookmarks.push(newBookmark);
    return res.status(201).json(newBookmark);
  });

booksmarkRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find((b) => b.id === id);
    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Bookmark not found.');
    }
    return res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.find((b) => b.id === id);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Bookmark not found.');
    }
    bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${id} deleted.`);
    return res.status(204).end();
  });

module.exports = booksmarkRouter;
