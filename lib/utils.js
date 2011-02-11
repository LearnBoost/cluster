
/*!
 * Cluster - utils
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Format byte-size.
 *
 * @param {Number} bytes
 * @return {String}
 * @api private
 */

exports.formatBytes = function(bytes) {
  var kb = 1024
    , mb = 1024 * kb
    , gb = 1024 * mb;
  if (bytes < kb) return bytes + 'b';
  if (bytes < mb) return (bytes / kb).toFixed(2) + 'kb';
  if (bytes < gb) return (bytes / mb).toFixed(2) + 'mb';
  return (bytes / gb).toFixed(2) + 'gb';
};

/**
 * Format date difference between `a` and `b`.
 *
 * @param {Date} a
 * @param {Date} b
 * @return {String}
 * @api private
 */

exports.formatDateRange = function(a, b) {
  var diff = a > b ? a - b : b - a
    , second = 1000
    , minute = second * 60
    , hour = minute * 60
    , day = hour * 24;

  if (diff < second) return diff + ' milliseconds';
  if (diff < minute) return (diff / second).toFixed(0) + ' seconds';
  if (diff < hour) return (diff / minute).toFixed(0) + ' minutes';
  if (diff < day) return (diff / hour).toFixed(0) + ' hours';
  return (diff / day).toFixed(1) + ' days';
};