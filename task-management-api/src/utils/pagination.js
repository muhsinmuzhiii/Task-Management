// takes a full list and returns only the requested page + info about the pages
function paginate(items, page, limit, req) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  // next / prev links, built with the URL class so the filters in the query string stay
  function makeLink(p) {
    const url = new URL(req.originalUrl, req.protocol + '://' + req.get('host'));
    url.searchParams.set('page', p);
    return url.pathname + url.search;
  }

  return {
    data: items.slice(start, start + limit),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      links: {
        next: page < totalPages ? makeLink(page + 1) : null,
        prev: page > 1 ? makeLink(Math.min(page - 1, totalPages)) : null,
      },
    },
  };
}

module.exports = { paginate };
