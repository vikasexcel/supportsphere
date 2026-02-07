import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis();

export default function Home() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const cachedAgents = await redis.get('agents');
        if (cachedAgents) {
          setAgents(JSON.parse(cachedAgents));
        } else {
          const response = await prisma.agent.findMany();
          setAgents(response);
          await redis.set('agents', JSON.stringify(response), 'EX', 3600);
        }
      } catch (err) {
        setError('Failed to load agents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.container}>
      <Head>
        <title>Support Agents</title>
        <meta name="description" content="Support agents management interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Support Agents</h1>
        <ul className={styles.agentList}>
          {agents.map(agent => (
            <li key={agent.id} className={styles.agentItem}>
              <h2>{agent.name}</h2>
              <p>{agent.email}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className={styles.footer}>
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
          Powered by Vercel
        </a>
      </footer>
    </div>
  );
}