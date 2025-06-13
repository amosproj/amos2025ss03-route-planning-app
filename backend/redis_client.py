# redis_client.py
import redis
import os

class RedisClient:
    _instance = None

    @classmethod
    def get_client(cls):
        if cls._instance is None:
            try:
                cls._instance = redis.Redis(
                    host=os.getenv("REDIS_HOST", "redis"),
                    port=int(os.getenv("REDIS_PORT", 6379)),
                    db=0,
                    decode_responses=True,
                )
                cls._instance.ping()
                print("✅ Redis connected successfully.")
            except redis.exceptions.ConnectionError as e:
                cls._instance = None
                print(f"❌ Redis connection failed: {e}")
        return cls._instance
