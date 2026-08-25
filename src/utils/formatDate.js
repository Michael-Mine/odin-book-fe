function formatDate(datePublished) {
  const timestamp = Date.parse(datePublished);
  return new Date(timestamp);
}

export default formatDate;
