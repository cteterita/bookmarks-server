const bookmarksService = {
  getAllBookmarks(knex) {
    return knex
      .select('*')
      .from('bookmarks');
  },
  getById(knex, id) {
    return knex
      .select('*')
      .from('bookmarks')
      .where('id', id)
      .first();
  },
  insertBookmark(knex, newBookmark) {
    return knex
      .insert(newBookmark)
      .into('bookmarks')
      .returning('*')
      .then((rows) => rows[0]);
  },
  deleteBookmark(knex, id) {
    return knex('bookmarks')
      .where({ id })
      .delete();
  },
  updateBookmark(knex, id, newBookmarkData) {
    return knex('bookmarks')
      .where({ id })
      .update(newBookmarkData);
  },
};

module.exports = bookmarksService;
