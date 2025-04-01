import { Migrator } from 'nesoi/lib/adapters/postgres/src/migrator';

/**
 * 1743502434142_cameras
 * $hash[v0.54040c124e65ac22786b09b25dd4cace]
 *
 * $type[create]
 * $table[cameras]
 * $fields[OmlkOltjcmVhdGU7c2VyaWFsNCBQUklNQVJZIEtFWTswOzE7O10KOnN0YXRlOltjcmVhdGU7Y2hhcmFjdGVyIHZhcnlpbmcgTk9UIE5VTEw7MDswOztdCjphbGlhczpbY3JlYXRlO2NoYXJhY3RlciB2YXJ5aW5nIE5PVCBOVUxMOzA7MDs7XQo6aGFzaDpbY3JlYXRlO2NoYXJhY3RlciB2YXJ5aW5nIE5PVCBOVUxMOzA7MDs7XQo6c3RyZWFtX2lkOltjcmVhdGU7Y2hhcmFjdGVyIHZhcnlpbmcgTk9UIE5VTEw7MDswOztdCjpoYXJib3JfaWQ6W2NyZWF0ZTtpbnRlZ2VyIE5PVCBOVUxMOzA7MDs7XQo6Y29vcmRfeDpbY3JlYXRlO2RvdWJsZSBwcmVjaXNpb24gTk9UIE5VTEw7MDswOztdCjpjb29yZF95OltjcmVhdGU7ZG91YmxlIHByZWNpc2lvbiBOT1QgTlVMTDswOzA7O10KOmNvb3JkX3o6W2NyZWF0ZTtkb3VibGUgcHJlY2lzaW9uIE5PVCBOVUxMOzA7MDs7XQo6cm90X3g6W2NyZWF0ZTtkb3VibGUgcHJlY2lzaW9uIE5PVCBOVUxMOzA7MDs7XQo6cm90X3k6W2NyZWF0ZTtkb3VibGUgcHJlY2lzaW9uIE5PVCBOVUxMOzA7MDs7XQo6cm90X3o6W2NyZWF0ZTtkb3VibGUgcHJlY2lzaW9uIE5PVCBOVUxMOzA7MDs7XQo6dHlwZV9pZDpbY3JlYXRlO2ludGVnZXIgTk9UIE5VTEw7MDswOztdCjpzZW5zb3Jfd2lkdGg6W2NyZWF0ZTtkb3VibGUgcHJlY2lzaW9uIE5PVCBOVUxMOzA7MDs7XQo6c2Vuc29yX2hlaWdodDpbY3JlYXRlO2RvdWJsZSBwcmVjaXNpb24gTk9UIE5VTEw7MDswOztdCjpjcmVhdGVkX2J5OltjcmVhdGU7Y2hhcmFjdGVyKDY0KTsxOzA7O10KOmNyZWF0ZWRfYXQ6W2NyZWF0ZTt0aW1lc3RhbXAgd2l0aG91dCB0aW1lIHpvbmU7MDswOztdCjp1cGRhdGVkX2J5OltjcmVhdGU7Y2hhcmFjdGVyKDY0KTsxOzA7O10KOnVwZGF0ZWRfYXQ6W2NyZWF0ZTt0aW1lc3RhbXAgd2l0aG91dCB0aW1lIHpvbmU7MDswOztd]
 */

export default Migrator.migration({
    up: async ({ sql }) => {
        await sql`
			CREATE TABLE cameras (
				"id" serial4 PRIMARY KEY,
				"state" character varying NOT NULL,
				"alias" character varying NOT NULL,
				"hash" character varying NOT NULL,
				"stream_id" character varying NOT NULL,
				"harbor_id" integer NOT NULL,
				"coord_x" double precision NOT NULL,
				"coord_y" double precision NOT NULL,
				"coord_z" double precision NOT NULL,
				"rot_x" double precision NOT NULL,
				"rot_y" double precision NOT NULL,
				"rot_z" double precision NOT NULL,
				"type_id" integer NOT NULL,
				"sensor_width" double precision NOT NULL,
				"sensor_height" double precision NOT NULL,
				"created_by" character(64),
				"created_at" timestamp without time zone,
				"updated_by" character(64),
				"updated_at" timestamp without time zone
			)
		`
    },
    down: async ({ sql }) => {
        await sql`
			DROP TABLE cameras
		`
    }
})