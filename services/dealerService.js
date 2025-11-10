const prisma = require("../utils/prisma");

exports.createDealer = async (dealerData) => {
  return prisma.dealer.create({
    data: dealerData,
  });
};

exports.getAllDealers = async () => {
  return prisma.dealer.findMany();
};

exports.getDealerDetails = async (id) => {
  return prisma.dealer.findUnique({
    where: { id: id },
    include: {
      cars: true,
      bikes: true,
    },
  });
};

exports.updateDealerById = async (dealerId, dataToUpdate) => {
  return prisma.dealer.update({
    where: { id: dealerId },
    data: dataToUpdate,
  });
};

exports.deleteDealer = async (id) => {
  return prisma.dealer.delete({
    where: { id: id },
  });
};
