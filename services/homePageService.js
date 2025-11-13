const prisma = require("../utils/prisma");

exports.fetchHeroSlides = async () => {
  return prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      car: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
        },
      },
      event: {
        select: {
          slug: true,
          title: true,
          description: true,
          primaryImage: true,
        },
      },
    },
  });
};
