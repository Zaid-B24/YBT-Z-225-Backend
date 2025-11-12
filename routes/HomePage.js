const express = require("express");
const router = express.Router();
const homePageController = require("../controllers/homePageController");

router.get("/hero-slides", homePageController.getHeroSlides);

module.exports = router;
