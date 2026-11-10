import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiscardCreatedAtUtc1793232005000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    // The published system stored UTC clock values in a column without a time zone.
    await q.query(`ALTER TABLE descarte ALTER COLUMN criado_em TYPE timestamptz
      USING criado_em AT TIME ZONE 'UTC'`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE descarte ALTER COLUMN criado_em TYPE timestamp
      USING criado_em AT TIME ZONE 'UTC'`);
  }
}
