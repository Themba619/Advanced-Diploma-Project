// utils/filterByQuery.js

function filterByQuery(data, query = "") {
  if (!query) return data;

  const q = query.toLowerCase();
  return data.filter(
    item =>
      item.category.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
  );
}

module.exports = { filterByQuery };
