const createSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

module.exports = createSlug;
