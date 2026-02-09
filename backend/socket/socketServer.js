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
            if (data.type === 'updateTicket') {
                const { ticketId, status, priority } = data.payload;
                await prisma.ticket.update({
                    where: { id: ticketId },
                    data: { status, priority },
                });
                const updatedTicket = await prisma.ticket.findUnique({
                    where: { id: ticketId },
                });
                broadcast(JSON.stringify({ type: 'ticketUpdated', payload: updatedTicket }));
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

const startServer = () => {
    wss.on('listening', () => {
        console.log('WebSocket server is running on ws://localhost:8080');
    });
};

startServer();

import { useEffect, useRef } from 'react';

const useWebSocket = (url) => {
    const socketRef = useRef(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socketRef.current = new WebSocket(url);

        socketRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, message]);
        };

        socketRef.current.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            socketRef.current.close();
        };
    }, [url]);

    const sendMessage = (message) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open. Message not sent:', message);
        }
    };

    return { messages, sendMessage };
};

export default useWebSocket;