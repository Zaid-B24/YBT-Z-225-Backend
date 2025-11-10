const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const apiRouter = require("./routes/Index");

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[Request Logger] ${req.method} ${req.originalUrl} took ${duration}ms`
    );
  });
  next();
});

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
