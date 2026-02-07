import mongoose from 'mongoose';
import redis from 'redis';
import amqp from 'amqplib';
import { Client } from '@elastic/elasticsearch';

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export let redisClient = null;

export const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err) => console.warn('Redis error:', err));
    redisClient.on('connect', () => console.log('Redis connected'));
    
    await redisClient.connect();
  } catch (error) {
    console.warn('Redis not available, continuing without it:', error.message);
    redisClient = null;
  }
};

export let elasticClient = null;

export const connectElasticsearch = async () => {
  try {
    elasticClient = new Client({
      node: process.env.ELASTICSEARCH_NODE
    });
    await elasticClient.ping();
    console.log('Elasticsearch connected');
  } catch (error) {
    console.warn('Elasticsearch not available, continuing without it:', error.message);
    elasticClient = null;
  }
};

export let rabbitChannel = null;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertQueue('auth_logs', { durable: true });
    await rabbitChannel.assertQueue('search_logs', { durable: true });
    console.log('RabbitMQ connected');
  } catch (error) {
    console.warn('RabbitMQ not available, continuing without it:', error.message);
    rabbitChannel = null;
  }
};
