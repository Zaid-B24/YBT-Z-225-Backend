const prisma = require("../utils/prisma");
exports.createDesigner = async (designerData) => {
  const { name, title, description, slug, image, stats } = designerData;
  return prisma.designer.create({
    data: {
      name,
      title,
      description,
      slug,
      image: image || "https://placehold.co/800x600?text=No+Image",
      stats: stats || {},
    },
  });
};

exports.getAllDesigners = async () => {
  return prisma.designer.findMany({
    orderBy: { name: "asc" },
  });
};

exports.getDesignerBySlug = async (slug) => {
  return prisma.designer.findUnique({
    where: { slug },
  });
};

exports.getDesignerById = async (id) => {
  return prisma.designer.findUnique({
    where: { id: id },
  });
};

exports.deleteDesignerById = async (id) => {
  return prisma.designer.delete({
    where: { id: id },
  });
};
