const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const redis = require("./utils/redis");
const apiRouter = require("./routes/Index");

const app = express();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4000",
    credentials: true,
  })
);
app.use(helmet());

const store = new RedisStore({
  client: redis,
  prefix: "ybt_session:",
});

app.use(
  session({
    store,
    name: "sid",
    secret: process.env.JWT_SECRET || "default_secret_change_this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// app.use((req, res, next) => {
//   const start = Date.now();
//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     console.log(
//       `[Request Logger] ${req.method} ${req.originalUrl} took ${duration}ms`
//     );
//   });
//   next();
// });

app.use("/api/v1", apiRouter);

app.get("/", (req, res) => {
  res.status(200).json("What are you doing here?");
});

app.use((err, req, res, next) => {
  console.error("--- UNHANDLED ERROR ---", err);
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
