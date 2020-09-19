const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');

const { makeBookmarksArray } = require('./bookmarks.fixtures');

const authHeader = {
  Authorization: 'Bearer 91ed489a-fe1e-4a26-9394-765e5118d142',
};

describe('Bookmarks Endpoints', () => {
  let db;
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });
  before('clean the table', () => db('bookmarks').truncate());
  afterEach('clean the table', () => db('bookmarks').truncate());
  after('disconnect from db', () => db.destroy());

  context('given the database has some data', () => {
    const testBookmarks = makeBookmarksArray();
    beforeEach('insert articles', () => db.into('bookmarks').insert(testBookmarks));

    it('GET /bookmarks responds with the test bookmarks', () => {
      const expectedBody = testBookmarks;
      return supertest(app)
        .get('/bookmarks')
        .set(authHeader)
        .expect(200, expectedBody);
    });

    it('GET /bookmarks/:id responds with a bookmark', () => {
      const id = 3;
      return supertest(app)
        .get(`/bookmarks/${id}`)
        .set(authHeader)
        .expect(200, testBookmarks[id - 1]);
    });
  });

  context('given the database has no data', () => {
    it('GET /bookmarks responds with an empty array', () => {
      const expectedBody = [];
      return supertest(app)
        .get('/bookmarks')
        .set(authHeader)
        .expect(200, expectedBody);
    });
    it('GET /bookmarks/:id responds with a 404', () => {
      const id = 3;
      return supertest(app)
        .get(`/bookmarks/${id}`)
        .set(authHeader)
        .expect(404, 'Bookmark not found.');
    });

    describe('POST /bookmarks', () => {
      it('successfully adds a valid bookmark', () => {
        const newBookmarkData = {
          title: 'Apple',
          url: 'http://www.apple.com',
          description: 'They make computers',
          rating: '4',
        };
        return supertest(app)
          .post('/bookmarks')
          .send(newBookmarkData)
          .set(authHeader)
          .expect(201)
          .expect((res) => {
            expect(res.body.title).to.eql(newBookmarkData.title);
            expect(res.body.url).to.eql(newBookmarkData.url);
            expect(res.body.description).to.eql(newBookmarkData.description);
            expect(res.body.rating).to.eql(newBookmarkData.rating);
          })
          .then((postRes) => supertest(app)
            .get(postRes.headers.location)
            .set(authHeader)
            .expect(postRes.body));
      });
      it('rejects a bookmark without a title', () => {
        const missingTitleData = {
          url: 'http://www.apple.com',
          description: 'They make computers',
          rating: '4',
        };
        return supertest(app)
          .post('/bookmarks')
          .send(missingTitleData)
          .set(authHeader)
          .expect(400, 'Invalid data: missing field');
      });
      it('rejects a bookmark with an invalid rating', () => {
        const invalidBookmarkData = {
          title: 'Apple',
          url: 'http://www.apple.com',
          description: 'They make computers',
          rating: '10',
        };
        return supertest(app)
          .post('/bookmarks')
          .send(invalidBookmarkData)
          .set(authHeader)
          .expect(400, 'Invalid data: rating must be between 1 and 5');
      });
    });
  });
});
