import { CollectionType } from "@prisma/client";

exports.getCollectionTypes = (req, res) => {
  try {
    const types = Object.values(CollectionType);
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch collection types" });
  }
};
