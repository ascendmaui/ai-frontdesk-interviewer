CREATE SCHEMA IF NOT EXISTS interviewer_private;
REVOKE ALL ON SCHEMA interviewer_private FROM PUBLIC;
CREATE TABLE IF NOT EXISTS interviewer_private.state (
  id integer PRIMARY KEY CHECK (id=1),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON interviewer_private.state FROM PUBLIC;
ALTER TABLE interviewer_private.state ENABLE ROW LEVEL SECURITY;
INSERT INTO interviewer_private.state(id,data)
VALUES(1,'{"interviews":[],"leads":[],"territories":[]}'::jsonb)
ON CONFLICT(id) DO NOTHING;
