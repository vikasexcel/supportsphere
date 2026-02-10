const redis = require('redis');

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis error: ', err);
});

const setCache = (key, value, expiration = 3600) => {
    return new Promise((resolve, reject) => {
        redisClient.setex(key, expiration, JSON.stringify(value), (err, reply) => {
            if (err) {
                return reject(err);
            }
            resolve(reply);
        });
    });
};

const getCache = (key) => {
    return new Promise((resolve, reject) => {
        redisClient.get(key, (err, reply) => {
            if (err) {
                return reject(err);
            }
            resolve(reply ? JSON.parse(reply) : null);
        });
    });
};

const clearCache = (key) => {
    return new Promise((resolve, reject) => {
        redisClient.del(key, (err, reply) => {
            if (err) {
                return reject(err);
            }
            resolve(reply);
        });
    });
};

module.exports = {
    setCache,
    getCache,
    clearCache,
};