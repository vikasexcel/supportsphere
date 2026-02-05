import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { OpenAIApi, Configuration } from 'openai';

const prisma = new PrismaClient();
const redis = new Redis();
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

async function prioritizeTicket(ticketId) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Prioritize the following support ticket based on urgency and importance: ${ticket.description}`,
      max_tokens: 60,
    });

    const priority = response.data.choices[0].text.trim();

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { priority },
    });

    await redis.set(`ticket:${ticketId}:priority`, priority);

    return { ticketId, priority };
  } catch (error) {
    console.error('Error prioritizing ticket:', error);
    throw new Error('Failed to prioritize ticket');
  }
}

export { prioritizeTicket };