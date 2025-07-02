import os
import redis
import logging

# Setup logger
logger = logging.getLogger(__name__)

class RedisClient:
    _instance = None

    @classmethod
    def get_client(cls):
        # Always check if Redis is still alive
        if cls._instance:
            try:
                cls._instance.ping()
                return cls._instance
            except redis.exceptions.ConnectionError as e:
                logger.warning(f"Lost Redis connection: {e}")
                cls._instance = None

        # Try fresh connection
        try:
            client = redis.Redis(
                host=os.getenv("REDIS_HOST", "redis"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=int(os.getenv("REDIS_DB", 0)),
                socket_connect_timeout=3,
                decode_responses=True,
            )
            client.ping()
            cls._instance = client
            logger.info("Redis connected successfully.")
        except redis.exceptions.ConnectionError as e:
            logger.warning(f"Redis connection failed: {e}")
            cls._instance = None

        return cls._instance
