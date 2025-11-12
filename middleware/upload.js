const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"];
const VIDEO_FORMATS = ["mp4", "mov", "avi", "mkv", "webm"];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder;
    let allowed_formats;
    let resource_type;

    if (file.fieldname === "images") {
      folder = "youngboytoyz/images";
      allowed_formats = IMAGE_FORMATS;
      resource_type = "image";
    } else if (file.fieldname === "videos") {
      folder = "youngboytoyz/videos";
      allowed_formats = VIDEO_FORMATS;
      resource_type = "video";
    } else {
      folder = "youngboytoyz/other";
      allowed_formats = [];
      resource_type = "auto";
    }

    return {
      folder,
      allowed_formats,
      resource_type,
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,

    files: 15,
  },
  fileFilter: (req, file, cb) => {
    let allowed;
    if (file.fieldname === "images") {
      allowed = IMAGE_FORMATS;
    } else if (file.fieldname === "videos") {
      allowed = VIDEO_FORMATS;
    } else {
      return cb(new Error("Invalid file field name."), false);
    }

    const ext = file.originalname.split(".").pop().toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: .${ext}`), false);
    }
  },
});

module.exports = upload;
