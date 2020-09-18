const bookmarksService = {
  getAllBookmarks(knex) {
    return knex.select('*').from('bookmarks');
  },
};

module.exports = bookmarksService;
