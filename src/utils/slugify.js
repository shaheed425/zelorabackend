const slugifyLib = require('slugify');

function createSlug(text) {
  if (!text) return '';
  return slugifyLib(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

module.exports = createSlug;
