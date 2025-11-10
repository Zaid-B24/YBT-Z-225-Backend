const slugify = require("slugify");
const prisma = require("../../utils/prisma");

exports.createEventCategory = async (eventCategoryData) => {
  const { name } = eventCategoryData;

  const slug = slugify(name, {
    lower: true,
    strict: true,
  });

  return prisma.eventCategory.create({
    data: {
      name,
      slug,
    },
  });
};

exports.getAllCategories = async () => {
  return prisma.eventCategory.findMany({
    orderBy: { name: "asc" },
  });
};
