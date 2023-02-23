const pg = require("pg");
const format = require("pg-format");
const db = require("../db/connection.js");

exports.selectReviews = () => {
  return db
    .query(
      `
      SELECT reviews.*, COUNT(comments.review_id) AS comment_count
      FROM reviews
      LEFT JOIN comments
      ON reviews.review_id = comments.review_id
      GROUP BY reviews.review_id
      ORDER BY reviews.created_at DESC;
      `
    )
    .then((result) => {
      const reviewArr = result.rows;
      reviewArr.forEach((review) => {
        review.comment_count = parseInt(review.comment_count);
      });
      return reviewArr;
    });
};

exports.selectReviewFromId = (reviewId) => {
  return db
    .query(
      `
  SELECT *
  FROM reviews
  WHERE review_id = $1
  `,
      [reviewId]
    )
    .then((result) => {
      const review = result.rows[0];
      if (!review) {
        return Promise.reject({
          status: 404,
          msg: `No review found for review ${reviewId}`,
        });
      }
      return review;
    });
};

exports.selectCommentsFromReview = (reviewId) => {
  return db
    .query(
      `
      SELECT *
      FROM reviews
      WHERE review_id = $1;
      `,
      [reviewId]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({
          status: 404,
          msg: `No review found for review ${reviewId}`,
        });
      } else {
        return db
          .query(
            `
            SELECT *
            FROM comments
            WHERE review_id = $1
            ORDER BY comments.created_at DESC;
            `,
            [reviewId]
          )
          .then((res) => {
            return res.rows;
          });
      }
    });
};

exports.patchComment = (review_id, inc_votes) => {
  return db
    .query(
      `
  UPDATE comments
  SET votes = votes + $1
  WHERE review_id = $2
  RETURNING *;
  `,
      [review_id, inc_votes]
    )
    .then((res) => {
      return res.rows[0];
    });
};
