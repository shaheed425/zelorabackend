function getPagination(queryPage, queryLimit, defaultLimit = 12) {
  const page = Math.max(1, parseInt(queryPage, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(queryLimit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function getPaginationMetadata(total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = {
  getPagination,
  getPaginationMetadata,
};
