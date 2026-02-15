const express = require('express');
const { PrismaClient } = require('@prisma/client');
const redis = require('redis');
const { Configuration, OpenAIApi } = require('openai');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
const redisClient = redis.createClient();

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig);

app.use(cors());
app.use(bodyParser.json());

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

app.get('/api/data', async (req, res) => {
  try {
    const data = await prisma.exampleModel.findMany();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/openai', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 100,
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).send('Internal Server Error');
  }
});

const startServer = async () => {
  try {
    await prisma.$connect();
    redisClient.connect();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();