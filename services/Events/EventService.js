const prisma = require("../../utils/prisma");

exports.createEvent = async (eventData) => {
  return prisma.event.create({
    data: eventData,
    include: {
      categories: true,
      ticketTypes: true,
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
  const { userRole, limit = 10, cursor, sortBy, category } = options;
  console.log(userRole, "This is user role");
  let whereClause = {};
  if (userRole !== "ADMIN") {
    whereClause.status = "PUBLISHED";
  }

  const orderByMap = {
    name_asc: [{ title: "asc" }, { id: "asc" }],
    name_desc: [{ title: "desc" }, { id: "asc" }],
    oldest: [{ startDate: "asc" }, { id: "asc" }],
    newest: [{ startDate: "desc" }, { id: "desc" }],
  };

  const orderBy = orderByMap[sortBy] || orderByMap.newest;

  const take = limit + 1;
  console.time("prisma_findMany_events");

  if (category) {
    whereClause.categories = {
      some: {
        slug: category, // Filters events where *at least one*
        // category in its list has this slug
      },
    };
  }

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
      primaryImage: true,

      // --- Relations to "include" ---
      // This is how you move your 'include' logic inside 'select'
      ticketTypes: {
        take: 1,
        // You can add another 'select' here for even more optimization
        select: {
          id: true,
          name: true,
          price: true,
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

  console.timeEnd("prisma_findMany_events");

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
    include: {
      categories: true,
      ticketTypes: true,
      // facilities: true,
      // youshouldKnow: true,
    },
  });
};

exports.deleteEvent = async (id) => {
  return prisma.event.delete({
    where: { id: id },
  });
};
