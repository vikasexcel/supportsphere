const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');
const redis = require('redis');

const prisma = new PrismaClient();
const redisClient = redis.createClient();

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'support_message') {
                // Save message to database
                await prisma.supportMessage.create({
                    data: {
                        content: data.content,
                        senderId: data.senderId,
                        timestamp: new Date(),
                    },
                });

                // Broadcast message to all connected clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'support_message',
                            content: data.content,
                            senderId: data.senderId,
                            timestamp: new Date(),
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    redisClient.quit();
    process.exit(0);
});