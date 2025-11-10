const redis = require("../utils/redis");
const handleIdempotency = async (req, res, next) => {
  const idempotencyKey = req.headers["idempotency-key"];
  if (!idempotencyKey) {
    return res
      .status(400)
      .json({ success: false, message: "Idempotency-Key header is required." });
  }

  const userId = req.user.id;
  const redisKey = `idempotency:${userId}:${idempotencyKey}`;

  try {
    // 1. Check if we've seen this key before
    const cachedResponse = await redis.get(redisKey);
    if (cachedResponse) {
      console.log("Idempotency hit: returning cached response.");
      const parsedResponse = JSON.parse(cachedResponse);
      return res.status(parsedResponse.status).json(parsedResponse.body);
    }

    // 2. If not, wrap res.json to cache the response when it's sent
    const originalJson = res.json;
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const responseToCache = {
          status: res.statusCode,
          body: body,
        };
        // Cache for 24 hours
        redis.set(redisKey, JSON.stringify(responseToCache), "EX", 86400);
      }
      return originalJson.call(res, body);
    };

    next();
  } catch (error) {
    console.error("Idempotency middleware error:", error);
    next(error);
  }
};

module.exports = handleIdempotency;
