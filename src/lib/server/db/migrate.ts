import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

export async function ensureTables() {
  const sql = neon(env.DATABASE_URL);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS feeds (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      url text NOT NULL,
      title text,
      favicon_url text,
      last_fetched_at timestamptz,
      etag text,
      last_modified text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      _deleted boolean NOT NULL DEFAULT false
    );

    CREATE UNIQUE INDEX IF NOT EXISTS feeds_url_idx ON feeds (url);
    CREATE INDEX IF NOT EXISTS feeds_updated_at_idx ON feeds (updated_at);

    CREATE TABLE IF NOT EXISTS articles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      feed_id uuid NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
      guid text NOT NULL,
      url text NOT NULL,
      title text,
      author text,
      published_at timestamptz,
      content_raw text,
      content_full text,
      content_status text NOT NULL DEFAULT 'unfetched' CHECK (content_status IN ('unfetched', 'fetched', 'failed')),
      excerpt text,
      image_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      _deleted boolean NOT NULL DEFAULT false
    );

    CREATE UNIQUE INDEX IF NOT EXISTS articles_feed_guid_idx ON articles (feed_id, guid);
    CREATE INDEX IF NOT EXISTS articles_updated_at_idx ON articles (updated_at);
    CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles (published_at);

    CREATE TABLE IF NOT EXISTS article_state (
      article_id uuid PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
      is_read boolean NOT NULL DEFAULT false,
      is_starred boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS article_state_updated_at_idx ON article_state (updated_at);
  `);
}
