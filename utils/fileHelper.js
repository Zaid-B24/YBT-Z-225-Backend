const processUploadedImages = (files, fieldName) => {
  const imageUrls = [];

  // Use bracket notation to dynamically access the correct field
  if (files?.[fieldName]) {
    const images = Array.isArray(files[fieldName])
      ? files[fieldName]
      : [files[fieldName]];

    imageUrls.push(...images.map((file) => file.path));
  }

  const primaryImage = imageUrls[0] || null;

  return { imageUrls, primaryImage };
};

module.exports = { processUploadedImages };
