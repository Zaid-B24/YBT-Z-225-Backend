const prisma = require("../../utils/prisma");

exports.createEvent = async (eventData) => {
  return prisma.event.create({
    data: eventData,
    include: {
      categories: true,
      ticketTypes: true,
      coupons: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

exports.getEventFilters = async () => {
  const categories = await prisma.eventCategory.findMany({
    where: {
      events: {
        some: {
          status: "PUBLISHED",
        },
      },
    },
    select: {
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return {
    categories,
  };
};

exports.updateEventStatus = async (eventId, newStatus) => {
  return prisma.event.update({
    where: {
      id: eventId,
    },
    data: {
      status: newStatus,
    },
  });
};

exports.getAllEvents = async (options = {}) => {
  const {
    userRole,
    limit = 10,
    cursor,
    sortBy,
    category,
    timeFilter = "upcoming",
  } = options;
  let whereClause = {};

  if (userRole !== "ADMIN") {
    whereClause.status = "PUBLISHED";
  }

  const now = new Date();
  if (timeFilter === "upcoming") {
    // Show events starting NOW or in Future
    whereClause.startDate = { gte: now };
  } else if (timeFilter === "past") {
    // Show events that already started
    whereClause.startDate = { lt: now };
  }

  if (category) {
    whereClause.categories = {
      some: { slug: category },
    };
  }

  let orderBy = [];

  if (sortBy) {
    // If user explicitly asks for a sort, honor it
    const orderByMap = {
      name_asc: [{ title: "asc" }, { id: "asc" }],
      name_desc: [{ title: "desc" }, { id: "asc" }],
      oldest: [{ startDate: "asc" }, { id: "asc" }],
      newest: [{ startDate: "desc" }, { id: "desc" }],
    };
    orderBy = orderByMap[sortBy] || orderByMap.newest;
  } else {
    // DEFAULT UX LOGIC (Better than hardcoding 'newest')
    if (timeFilter === "upcoming") {
      // Upcoming: Show SOONEST first (Ascending)
      orderBy = [{ startDate: "asc" }, { id: "asc" }];
    } else {
      // Past/All: Show NEWEST first (Descending)
      orderBy = [{ startDate: "desc" }, { id: "desc" }];
    }
  }

  const take = limit + 1;
  const events = await prisma.event.findMany({
    where: whereClause,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: take,
    orderBy: orderBy,
    select: {
      // Scalar fields you want to KEEP
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      status: true,
      isFeatured: true,
      maxAttendees: true,
      startDate: true,
      endDate: true,
      thumbnail: true,
      mobileThumbnail: true,
      coupons: true,

      // --- Relations to "include" ---
      // This is how you move your 'include' logic inside 'select'
      ticketTypes: {
        where: {
          quantity: { gt: 0 }, // Only consider tickets in stock
        },
        orderBy: {
          price: "asc", // Cheapest first
        },
        take: 1, // We only need the lowest price for the card
        select: {
          price: true,
          name: true, // "Early Bird"
        },
      },
      categories: {
        // You can also be specific here
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  let hasNextPage = false;
  if (events.length > limit) {
    hasNextPage = true;
    events.pop();
  }

  const nextCursor = hasNextPage ? events[events.length - 1].id : null;

  return {
    data: events,
    nextCursor,
    hasNextPage,
  };
};

exports.getTotalEventsCount = async () => {
  return prisma.event.count();
};

exports.getEventBySlug = async (slug) => {
  return prisma.event.findUnique({
    where: {
      slug: slug,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
      location: true,
      thumbnail: true,
      mobileThumbnail: true,
      imageUrls: true,
      imageUrlsMobile: true,
      videoUrls: true,
      videoUrlsMobile: true,
      facilities: true,
      youshouldKnow: true,
      categories: {
        select: { name: true, slug: true },
      },
      ticketTypes: {
        orderBy: { price: "asc" },
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          quantitySold: true,
          saleStartDate: true,
          saleEndDate: true,
        },
      },
    },
  });
};

exports.deleteEvent = async (id) => {
  return prisma.event.delete({
    where: { id: id },
  });
};
