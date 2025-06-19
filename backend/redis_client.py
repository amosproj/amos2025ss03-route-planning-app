import os
import redis
import logging

# Setup logger
logger = logging.getLogger(__name__)

class RedisClient:
    _instance = None

    @classmethod
    def get_client(cls):
        if cls._instance is None:
            try:
                cls._instance = redis.Redis(
                    host=os.getenv("REDIS_HOST", "redis"),
                    port=int(os.getenv("REDIS_PORT", 6379)),
                    db=int(os.getenv("REDIS_DB", 0)),
                    socket_connect_timeout=3,
                    decode_responses=True,
                )
                cls._instance.ping()
                logger.info("✅ Redis connected successfully.")
            except redis.exceptions.ConnectionError as e:
                cls._instance = None
                logger.warning(f"⚠️ Redis connection failed: {e}")
        return cls._instance
