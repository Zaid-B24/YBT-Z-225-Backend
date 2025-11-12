const prisma = require("../utils/prisma");

exports.createHeroSlide = async (slideData) => {
  return prisma.heroSlide.create({
    data: slideData,
  });
};

exports.getHeroSlides = async () => {
  return prisma.heroSlide.findMany({
    orderBy: {
      order: "asc",
    },
    include: {
      car: {
        select: { title: true, thumbnail: true },
      },
      event: {
        select: { title: true, primaryImage: true },
      },
    },
  });
};

exports.deleteslide = async (id) => {
  return prisma.heroSlide.delete({
    where: { id: id },
  });
};

exports.updateSlide = async (id, slideData) => {
  return prisma.heroSlide.update({
    where: { id: id },
    data: slideData,
  });
};

exports.reorderSlides = async (slideOrder) => {
  const updatePromises = slideOrder.map((id, index) =>
    prisma.heroSlide.update({
      where: { id: parseInt(id) },
      data: { order: index },
    })
  );
  return prisma.$transaction(updatePromises);
};
