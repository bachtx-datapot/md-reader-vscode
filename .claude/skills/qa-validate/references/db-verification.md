# DB Verification Patterns

## Parameterized Queries (RT-4)

**NEVER** interpolate UI-observed data directly into shell strings.
Use psql variables or temp .sql files for safe parameterization.

### Connection String
Read from `.qa-config.yaml` `database.url` or fallback to `DATABASE_URL` env var (RT-11).

```bash
DB_URL="${QA_DB_URL:-$DATABASE_URL}"
```

### After Create
```bash
psql "$DB_URL" -t -A -c "SELECT id, code, created_at FROM {table} WHERE code = \$1 ORDER BY created_at DESC LIMIT 1" -v "1='{expected_code}'"
```

**Safer alternative** (temp .sql file):
```bash
cat > /tmp/qa-check.sql << 'EOSQL'
SELECT id, code, created_at FROM {table} WHERE code = $1 ORDER BY created_at DESC LIMIT 1;
EOSQL
psql "$DB_URL" -f /tmp/qa-check.sql -v "1='{expected_code}'"
```

### After Update
```bash
psql "$DB_URL" -t -A -c "SELECT id, {field}, updated_at FROM {table} WHERE code = \$1" -v "1='{code}'"
```

### After Soft Delete
```bash
psql "$DB_URL" -t -A -c "SELECT id, deleted_at FROM {table} WHERE code = \$1" -v "1='{code}'"
```

### Cross-User Visibility
```bash
psql "$DB_URL" -t -A -c "SELECT id, tenant_id, created_by FROM {table} WHERE code = \$1" -v "1='{code}'"
```

### Row Count Verification
```bash
psql "$DB_URL" -t -A -c "SELECT count(*) FROM {table} WHERE {condition}"
```

## Output Format

Save query results as JSON for evidence:
```bash
psql "$DB_URL" -t -A --csv -c "{query}" > evidence/db-checks/step-{N}-{description}.json
```

## Error Handling

If psql fails:
1. Check `DATABASE_URL` is set
2. Check DB server is running: `pg_isready -h localhost`
3. If both fail → mark DB verification as INCONCLUSIVE, log warning, continue
