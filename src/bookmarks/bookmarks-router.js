const express = require('express');
const { isWebUri } = require('valid-url'); // Got this idea from the solution
const xss = require('xss');
const logger = require('../logger');
const bookmarksService = require('./bookmarks-service');

const booksmarkRouter = express.Router();
const bodyParser = express.json();

const formatBookmark = (bookmark) => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  description: xss(bookmark.description),
  url: bookmark.url,
  rating: bookmark.rating,
});

booksmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    bookmarksService.getAllBookmarks(req.app.get('db'))
      .then((bookmarks) => res.status(200).json(bookmarks.map(formatBookmark)));
  })
  .post(bodyParser, (req, res, next) => {
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

    if (!['1', '2', '3', '4', '5'].includes(rating)) {
      logger.error(`POST /bookmarks failed due to invalid rating ${rating}`);
      return res.status(400).send('Invalid data: rating must be between 1 and 5');
    }

    if (!isWebUri(url)) {
      logger.error(`POST /bookmarks failed due to invalid url ${url}`);
      return res.status(400).send('Invalid data: url must be a valid web url');
    }

    const newBookmark = {
      title,
      url,
      description,
      rating,
    };

    bookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then((bookmark) => {
        logger.info(`Bookmark with id ${bookmark.id} created`);
        newBookmark.id = bookmark.id;
        return res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(formatBookmark(newBookmark));
      })
      .catch(next);
    return res.status(400);
  });

booksmarkRouter
  .route('/bookmarks/:id')
  .all((req, res, next) => {
    const { id } = req.params;
    bookmarksService.getById(req.app.get('db'), id)
      .then((bookmark) => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res
            .status(404)
            .send('Bookmark not found.');
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(formatBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    const { id } = req.params;
    bookmarksService.deleteBookmark(req.app.get('db'), id)
      .then(() => {
        logger.info(`Bookmark ${id} deleted.`);
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { id } = req.params;
    const {
      title,
      url,
      description,
      rating,
    } = req.body;

    if (!title && !url && !description && !rating) {
      return res.status(400).send('Must update one of title, url, description, or rating.');
    }
    const newBookmarkData = {
      title,
      url,
      description,
      rating,
    };

    bookmarksService.updateBookmark(req.app.get('db'), id, newBookmarkData)
      .then(() => {
        logger.info(`Bookmark ${id} updated: ${newBookmarkData}`);
        return res.status(204).end();
      })
      .catch(next);
  });

module.exports = booksmarkRouter;
