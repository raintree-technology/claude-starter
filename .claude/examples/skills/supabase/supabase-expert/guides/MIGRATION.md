# Migration Guide

Comprehensive guide for migrating to Supabase from other platforms and managing schema migrations.

## Table of Contents

1. [Firebase to Supabase](#firebase-to-supabase)
2. [Parse to Supabase](#parse-to-supabase)
3. [MongoDB to Supabase](#mongodb-to-supabase)
4. [MySQL/PostgreSQL to Supabase](#mysqlpostgresql-to-supabase)
5. [Schema Migrations](#schema-migrations)
6. [Data Migration Scripts](#data-migration-scripts)
7. [Zero-Downtime Migration](#zero-downtime-migration)
8. [Post-Migration Checklist](#post-migration-checklist)

---

## Firebase to Supabase

### Overview

Firebase uses a NoSQL document-based structure, while Supabase uses PostgreSQL (relational). Key differences:

| Firebase | Supabase |
|----------|----------|
| Firestore Collections | PostgreSQL Tables |
| Documents | Rows |
| Subcollections | Foreign Keys/Relations |
| Security Rules | Row Level Security (RLS) |
| Cloud Functions | Edge Functions |
| Firebase Storage | Supabase Storage |
| Firebase Auth | Supabase Auth |

### Step 1: Schema Design

**Firebase Structure:**
```javascript
// Firebase Firestore
users/{userId}
  - email: string
  - name: string
  - posts/{postId}
    - title: string
    - content: string
    - comments/{commentId}
      - text: string
      - author: string
```

**Supabase Schema:**
```sql
-- Create tables with proper relationships
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can read published posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Step 2: Migrate Authentication

```typescript
// Export Firebase users
import admin from 'firebase-admin'
import { createClient } from '@supabase/supabase-js'

const serviceAccount = require('./firebase-adminsdk.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrateUsers() {
  const listUsersResult = await admin.auth().listUsers()

  for (const user of listUsersResult.users) {
    try {
      // Create user in Supabase
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email!,
        email_confirm: user.emailVerified,
        user_metadata: {
          display_name: user.displayName,
          photo_url: user.photoURL,
          firebase_uid: user.uid,
        },
        // If you have password hashes, you can import them
        // Otherwise, users will need to reset password
      })

      if (error) {
        console.error(`Failed to migrate user ${user.email}:`, error)
        continue
      }

      console.log(`Migrated user: ${user.email}`)

      // Store mapping for data migration
      await supabase.from('user_migrations').insert({
        firebase_uid: user.uid,
        supabase_uid: data.user.id,
      })

    } catch (error) {
      console.error(`Error migrating user ${user.email}:`, error)
    }
  }
}

migrateUsers()
```

### Step 3: Migrate Data

```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { createClient } from '@supabase/supabase-js'

const firebaseApp = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
})

const firestore = getFirestore(firebaseApp)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrateCollection(
  collectionName: string,
  transform: (doc: any) => any
) {
  const snapshot = await getDocs(collection(firestore, collectionName))

  const batch = []
  const batchSize = 100

  for (const doc of snapshot.docs) {
    const data = doc.data()
    const transformed = transform({ id: doc.id, ...data })

    batch.push(transformed)

    if (batch.length >= batchSize) {
      const { error } = await supabase
        .from(collectionName)
        .insert(batch)

      if (error) {
        console.error(`Error inserting batch for ${collectionName}:`, error)
      }

      console.log(`Migrated ${batch.length} records from ${collectionName}`)
      batch.length = 0
    }
  }

  // Insert remaining records
  if (batch.length > 0) {
    await supabase.from(collectionName).insert(batch)
    console.log(`Migrated final ${batch.length} records from ${collectionName}`)
  }
}

// Migrate posts
await migrateCollection('posts', (doc) => ({
  id: doc.id,
  user_id: doc.userId, // Map to Supabase user ID
  title: doc.title,
  content: doc.content,
  created_at: doc.createdAt?.toDate() || new Date(),
}))

// Migrate nested subcollections
async function migrateSubcollections() {
  const postsSnapshot = await getDocs(collection(firestore, 'posts'))

  for (const postDoc of postsSnapshot.docs) {
    const commentsSnapshot = await getDocs(
      collection(firestore, `posts/${postDoc.id}/comments`)
    )

    const comments = commentsSnapshot.docs.map(commentDoc => ({
      id: commentDoc.id,
      post_id: postDoc.id,
      user_id: commentDoc.data().userId,
      text: commentDoc.data().text,
      created_at: commentDoc.data().createdAt?.toDate() || new Date(),
    }))

    if (comments.length > 0) {
      await supabase.from('comments').insert(comments)
      console.log(`Migrated ${comments.length} comments for post ${postDoc.id}`)
    }
  }
}

await migrateSubcollections()
```

### Step 4: Migrate Storage

```typescript
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage'

const firebaseStorage = getStorage(firebaseApp)

async function migrateStorage() {
  const listRef = ref(firebaseStorage, '/')
  const res = await listAll(listRef)

  for (const itemRef of res.items) {
    try {
      // Download from Firebase
      const url = await getDownloadURL(itemRef)
      const metadata = await getMetadata(itemRef)

      const response = await fetch(url)
      const blob = await response.blob()

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(itemRef.fullPath, blob, {
          contentType: metadata.contentType,
          upsert: true,
        })

      if (error) {
        console.error(`Failed to migrate ${itemRef.fullPath}:`, error)
        continue
      }

      console.log(`Migrated file: ${itemRef.fullPath}`)

    } catch (error) {
      console.error(`Error migrating ${itemRef.fullPath}:`, error)
    }
  }
}

await migrateStorage()
```

### Step 5: Migrate Security Rules to RLS

**Firebase Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

**Equivalent Supabase RLS:**
```sql
-- Read: Anyone can read
CREATE POLICY "Anyone can read posts"
  ON posts FOR SELECT
  USING (true);

-- Write: Only own posts
CREATE POLICY "Users can manage own posts"
  ON posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Parse to Supabase

### Step 1: Schema Mapping

**Parse Class → Supabase Table**

```typescript
// Parse Server schema export
import Parse from 'parse/node'

Parse.initialize(process.env.PARSE_APP_ID!, process.env.PARSE_MASTER_KEY!)
Parse.serverURL = process.env.PARSE_SERVER_URL!

async function exportParseSchema() {
  const schemas = await Parse.Schema.all()

  for (const schema of schemas) {
    console.log(`\nTable: ${schema.className}`)
    console.log('Fields:', schema.fields)

    // Generate SQL
    const createTable = generateCreateTable(schema)
    console.log(createTable)
  }
}

function generateCreateTable(schema: Parse.Schema): string {
  let sql = `CREATE TABLE ${schema.className.toLowerCase()} (\n`
  sql += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`

  for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
    if (fieldName === 'objectId') continue

    let type = 'TEXT'
    switch (fieldConfig.type) {
      case 'String':
        type = 'TEXT'
        break
      case 'Number':
        type = 'NUMERIC'
        break
      case 'Boolean':
        type = 'BOOLEAN'
        break
      case 'Date':
        type = 'TIMESTAMPTZ'
        break
      case 'Array':
        type = 'JSONB'
        break
      case 'Object':
        type = 'JSONB'
        break
      case 'Pointer':
        type = 'UUID'
        break
    }

    sql += `  ${fieldName.toLowerCase()} ${type},\n`
  }

  sql += `  created_at TIMESTAMPTZ DEFAULT NOW(),\n`
  sql += `  updated_at TIMESTAMPTZ DEFAULT NOW()\n`
  sql += `);\n`

  return sql
}
```

### Step 2: Migrate Parse Data

```typescript
async function migrateParseClass(className: string) {
  const query = new Parse.Query(className)
  query.limit(1000) // Batch size

  let skip = 0
  let hasMore = true

  while (hasMore) {
    query.skip(skip)
    const objects = await query.find({ useMasterKey: true })

    if (objects.length === 0) {
      hasMore = false
      break
    }

    const records = objects.map(obj => ({
      id: obj.id,
      ...obj.attributes,
      created_at: obj.createdAt,
      updated_at: obj.updatedAt,
    }))

    const { error } = await supabase
      .from(className.toLowerCase())
      .insert(records)

    if (error) {
      console.error(`Error migrating ${className}:`, error)
    }

    console.log(`Migrated ${objects.length} ${className} records`)

    skip += objects.length
  }
}

// Migrate all classes
const classes = ['User', 'Post', 'Comment', 'Media']
for (const className of classes) {
  await migrateParseClass(className)
}
```

---

## MongoDB to Supabase

### Schema Design

```javascript
// MongoDB Document
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "John Doe",
  email: "john@example.com",
  posts: [
    {
      title: "My Post",
      content: "...",
      tags: ["tech", "coding"]
    }
  ],
  metadata: {
    lastLogin: ISODate("2024-01-01"),
    preferences: {
      theme: "dark"
    }
  }
}
```

**Normalized Approach (Recommended):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Denormalized Approach (for simple cases):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  posts JSONB[], -- Keep embedded documents
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration Script

```typescript
import { MongoClient } from 'mongodb'
import { createClient } from '@supabase/supabase-js'

const mongoClient = new MongoClient(process.env.MONGODB_URI!)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrateFromMongoDB() {
  await mongoClient.connect()
  const db = mongoClient.db('myapp')

  // Migrate users
  const usersCollection = db.collection('users')
  const usersCursor = usersCollection.find()

  const users = []
  for await (const user of usersCursor) {
    users.push({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      metadata: user.metadata,
      created_at: user.createdAt,
    })

    // Batch insert
    if (users.length >= 100) {
      await supabase.from('users').insert(users)
      console.log(`Migrated ${users.length} users`)
      users.length = 0
    }
  }

  // Insert remaining
  if (users.length > 0) {
    await supabase.from('users').insert(users)
  }

  await mongoClient.close()
}

migrateFromMongoDB()
```

---

## MySQL/PostgreSQL to Supabase

### Using pg_dump and pg_restore

```bash
# Export from existing PostgreSQL
pg_dump -h source-host -U username -d database_name \
  --no-owner --no-privileges \
  -f backup.sql

# Import to Supabase
psql -h db.xxx.supabase.co -U postgres -d postgres \
  -f backup.sql

# Or using Supabase CLI
supabase db push --db-url "postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres"
```

### Using Data Migration Scripts

```typescript
import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'

const mysqlConnection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrateTable(tableName: string) {
  const [rows] = await mysqlConnection.query(`SELECT * FROM ${tableName}`)

  const batchSize = 100
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)

    const { error } = await supabase
      .from(tableName)
      .insert(batch)

    if (error) {
      console.error(`Error migrating ${tableName}:`, error)
    } else {
      console.log(`Migrated ${batch.length} rows from ${tableName}`)
    }
  }
}

// Migrate all tables
const tables = ['users', 'posts', 'comments']
for (const table of tables) {
  await migrateTable(table)
}

await mysqlConnection.end()
```

---

## Schema Migrations

### Using Supabase CLI

```bash
# Initialize Supabase
supabase init

# Create migration
supabase migration new add_posts_table

# Edit migration file: supabase/migrations/XXXXXX_add_posts_table.sql
```

**Migration File:**
```sql
-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_published_idx ON posts(published) WHERE published = true;

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public posts are viewable"
  ON posts FOR SELECT
  USING (published = true);

CREATE POLICY "Users can manage own posts"
  ON posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

```bash
# Apply migration locally
supabase db reset

# Push to production
supabase db push
```

### Rollback Migrations

```bash
# Create rollback migration
supabase migration new rollback_posts_table
```

```sql
-- Rollback: Drop posts table
DROP TABLE IF EXISTS posts CASCADE;
```

---

## Data Migration Scripts

### Complete Migration Template

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface MigrationLog {
  table: string
  records_migrated: number
  errors: number
  started_at: Date
  completed_at?: Date
}

class DataMigration {
  private logs: MigrationLog[] = []

  async migrate() {
    console.log('Starting migration...\n')

    try {
      await this.migrateUsers()
      await this.migratePosts()
      await this.migrateComments()

      console.log('\n✓ Migration complete!')
      this.printSummary()

    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  async migrateUsers() {
    const log: MigrationLog = {
      table: 'users',
      records_migrated: 0,
      errors: 0,
      started_at: new Date(),
    }

    try {
      // Fetch from source
      const sourceUsers = await this.fetchSourceUsers()

      // Transform data
      const transformed = sourceUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        // ... other fields
      }))

      // Insert in batches
      const batchSize = 100
      for (let i = 0; i < transformed.length; i += batchSize) {
        const batch = transformed.slice(i, i + batchSize)

        const { error } = await supabase
          .from('users')
          .insert(batch)

        if (error) {
          console.error(`Batch ${i / batchSize} failed:`, error)
          log.errors += batch.length
        } else {
          log.records_migrated += batch.length
          console.log(`✓ Migrated ${log.records_migrated}/${transformed.length} users`)
        }
      }

    } finally {
      log.completed_at = new Date()
      this.logs.push(log)
    }
  }

  async migratePosts() {
    // Similar implementation
  }

  async migrateComments() {
    // Similar implementation
  }

  async fetchSourceUsers(): Promise<any[]> {
    // Implement based on source
    return []
  }

  printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('MIGRATION SUMMARY')
    console.log('='.repeat(60))

    for (const log of this.logs) {
      const duration = log.completed_at
        ? (log.completed_at.getTime() - log.started_at.getTime()) / 1000
        : 0

      console.log(`\n${log.table}:`)
      console.log(`  Records: ${log.records_migrated}`)
      console.log(`  Errors: ${log.errors}`)
      console.log(`  Duration: ${duration}s`)
    }

    console.log('\n' + '='.repeat(60))
  }
}

// Run migration
const migration = new DataMigration()
await migration.migrate()
```

---

## Zero-Downtime Migration

### Dual-Write Strategy

```typescript
// Write to both old and new systems during migration
class DualWriteService {
  async createPost(data: any) {
    // Write to new system (Supabase)
    const supabasePromise = supabase
      .from('posts')
      .insert(data)
      .select()
      .single()

    // Write to old system (Firebase)
    const firebasePromise = firestore
      .collection('posts')
      .add(data)

    // Wait for both
    const [supabaseResult, firebaseResult] = await Promise.allSettled([
      supabasePromise,
      firebasePromise,
    ])

    // Log any failures
    if (supabaseResult.status === 'rejected') {
      console.error('Supabase write failed:', supabaseResult.reason)
    }
    if (firebaseResult.status === 'rejected') {
      console.error('Firebase write failed:', firebaseResult.reason)
    }

    // Return Supabase result
    return supabaseResult.status === 'fulfilled'
      ? supabaseResult.value.data
      : null
  }
}
```

### Feature Flag for Gradual Rollout

```typescript
import { createClient } from '@supabase/supabase-js'

// Feature flag to control which users use new system
async function getPost(postId: string) {
  const useSupabase = await checkFeatureFlag('use_supabase')

  if (useSupabase) {
    // New system
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    return data
  } else {
    // Old system
    const doc = await firestore
      .collection('posts')
      .doc(postId)
      .get()

    return doc.data()
  }
}

async function checkFeatureFlag(flag: string): Promise<boolean> {
  // Check feature flag service (LaunchDarkly, etc.)
  return process.env.FEATURE_FLAGS?.includes(flag) || false
}
```

---

## Post-Migration Checklist

### Data Validation

```typescript
async function validateMigration() {
  console.log('Validating migration...\n')

  // Check record counts
  const { count: supabaseCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const firebaseCount = (await firestore.collection('users').get()).size

  console.log(`Firebase users: ${firebaseCount}`)
  console.log(`Supabase users: ${supabaseCount}`)

  if (supabaseCount !== firebaseCount) {
    console.error('⚠️  Record count mismatch!')
  } else {
    console.log('✓ Record counts match')
  }

  // Spot check data integrity
  const { data: sample } = await supabase
    .from('users')
    .select('*')
    .limit(10)

  for (const user of sample || []) {
    const firebaseDoc = await firestore
      .collection('users')
      .doc(user.id)
      .get()

    const firebaseData = firebaseDoc.data()

    if (user.email !== firebaseData?.email) {
      console.error(`⚠️  Data mismatch for user ${user.id}`)
    }
  }

  console.log('✓ Spot check passed')
}
```

### Performance Testing

```bash
# Run load tests against Supabase
k6 run load-test.js
```

```javascript
// load-test.js
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
}

export default function () {
  const res = http.get('https://your-project.supabase.co/rest/v1/posts', {
    headers: {
      'apikey': __ENV.SUPABASE_ANON_KEY,
    },
  })

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

### Cutover Plan

1. **Pre-Cutover (1 week before)**
   - Enable dual-write to both systems
   - Verify data sync
   - Test all critical paths

2. **Cutover Day**
   - Enable feature flag for 10% of users
   - Monitor for errors
   - Gradually increase to 50%, 100%
   - Switch reads to Supabase
   - Disable writes to old system

3. **Post-Cutover (1 week after)**
   - Monitor performance and errors
   - Keep old system read-only for 1 week
   - Archive old system data

---

## Resources

- [Supabase Migration Docs](https://supabase.com/docs/guides/migrations)
- [Firebase to Supabase](https://supabase.com/docs/guides/migrations/firebase-auth)
- [Schema Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
