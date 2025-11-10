const redis = require("../utils/redis"); // Make sure this path to your redis config is correct

const TICKET_LOCK_TTL = 600; // 10 minutes in seconds

// Helper function to create a consistent key name for Redis locks
const getLockKey = (ticketTypeId) => `locks:ticketType:${ticketTypeId}`;

exports.getLockedCount = async (ticketTypeId) => {
  const lockKey = getLockKey(ticketTypeId);
  const lockedCount = await redis.get(lockKey);
  return parseInt(lockedCount) || 0;
};

exports.createLock = async (ticketTypeId, quantity) => {
  const lockKey = getLockKey(ticketTypeId);
  // The syntax for node-redis is to chain commands off of .multi()
  await redis
    .multi()
    .incrBy(lockKey, quantity)
    .expire(lockKey, TICKET_LOCK_TTL)
    .exec();
};

exports.releaseLock = async (ticketTypeId, quantity) => {
  const lockKey = getLockKey(ticketTypeId);
  await redis.decrBy(lockKey, quantity);
};
