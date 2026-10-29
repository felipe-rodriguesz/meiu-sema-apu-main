import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from '../config/environment';
import { InitialSchema1793232000000 } from './migrations/1793232000000-initial-schema';
import { Weights1793232001000 } from './migrations/1793232001000-weights';
import { Receipts1793232002000 } from './migrations/1793232002000-receipts';

export default new DataSource({
  ...databaseOptions(process.env),
  migrations: [InitialSchema1793232000000, Weights1793232001000, Receipts1793232002000],
  migrationsTableName: 'meiu_migrations',
});
