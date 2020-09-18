const express = require('express');
const { v4: uuid } = require('uuid');
const { isWebUri } = require('valid-url'); // Got this idea from the solution
const xss = require('xss');
const logger = require('../logger');
const { dummyBookmarks } = require('../store');
const bookmarksService = require('./bookmarks-service');

const booksmarkRouter = express.Router();
const bodyParser = express.json();

const formatBookmark = (bookmark) => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  description: xss(bookmark.description),
  url: bookmark.url,
  rating: Number(bookmark.rating),
});

booksmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    bookmarksService.getAllBookmarks(req.app.get('db'))
      .then((bookmarks) => res.status(200).json(bookmarks.map(formatBookmark)));
  })
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
    dummyBookmarks.push(newBookmark);
    return res.status(201).json(newBookmark);
  });

booksmarkRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    bookmarksService.getById(req.app.get('db'), id)
      .then((bookmark) => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res
            .status(404)
            .send('Bookmark not found.');
        }
        return res.json(formatBookmark(bookmark));
      });
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = dummyBookmarks.find((b) => b.id === id);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Bookmark not found.');
    }
    dummyBookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${id} deleted.`);
    return res.status(204).end();
  });

module.exports = booksmarkRouter;
