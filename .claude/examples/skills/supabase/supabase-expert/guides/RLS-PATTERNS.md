# Supabase RLS (Row Level Security) Patterns

Complete guide to implementing secure, scalable RLS policies for common application patterns.

## Table of Contents

1. [Basic Patterns](#basic-patterns)
2. [Multi-Tenancy](#multi-tenancy)
3. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
4. [Hierarchical Data](#hierarchical-data)
5. [Time-Based Access](#time-based-access)
6. [Advanced Patterns](#advanced-patterns)
7. [Testing RLS](#testing-rls)
8. [Performance Optimization](#performance-optimization)

---

## Basic Patterns

### Pattern 1: User-Owned Resources

**Use Case:** Users can only access their own data (profiles, preferences, etc.)

```sql
-- Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX user_profiles_user_id_idx ON user_profiles(user_id);
```

### Pattern 2: Public Read, Authenticated Write

**Use Case:** Blog posts - anyone can read, only authenticated users can write

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Public can view published posts"
  ON posts FOR SELECT
  USING (published = true);

-- Users can view their own unpublished posts
CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Multi-Tenancy

### Pattern 3: Organization-Based Multi-Tenancy

**Use Case:** SaaS application where users belong to organizations

```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members with roles
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Tenant data (example: projects)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_organization_role(org_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (is_organization_member(id));

-- Organization members policies
CREATE POLICY "Users can view organization members"
  ON organization_members FOR SELECT
  USING (is_organization_member(organization_id));

-- Only owners and admins can manage members
CREATE POLICY "Owners and admins can insert members"
  ON organization_members FOR INSERT
  WITH CHECK (get_user_organization_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update members"
  ON organization_members FOR UPDATE
  USING (get_user_organization_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can delete members"
  ON organization_members FOR DELETE
  USING (get_user_organization_role(organization_id) = 'owner');

-- Projects policies
CREATE POLICY "Organization members can view projects"
  ON projects FOR SELECT
  USING (is_organization_member(organization_id));

CREATE POLICY "Members and above can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    is_organization_member(organization_id)
    AND get_user_organization_role(organization_id) IN ('owner', 'admin', 'member')
    AND auth.uid() = created_by
  );

CREATE POLICY "Members and above can update projects"
  ON projects FOR UPDATE
  USING (
    is_organization_member(organization_id)
    AND get_user_organization_role(organization_id) IN ('owner', 'admin', 'member')
  );

CREATE POLICY "Admins and owners can delete projects"
  ON projects FOR DELETE
  USING (get_user_organization_role(organization_id) IN ('owner', 'admin'));

-- Indexes
CREATE INDEX org_members_user_idx ON organization_members(user_id);
CREATE INDEX org_members_org_idx ON organization_members(organization_id);
CREATE INDEX projects_org_idx ON projects(organization_id);
```

---

## Role-Based Access Control (RBAC)

### Pattern 4: Fine-Grained Permissions

**Use Case:** Complex permission system with granular access control

```sql
-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL, -- e.g., 'posts', 'comments'
  action TEXT NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
  UNIQUE(resource, action)
);

-- Role permissions (many-to-many)
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User roles
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id, organization_id)
);

-- Helper function to check permission
CREATE OR REPLACE FUNCTION user_has_permission(
  resource_name TEXT,
  action_name TEXT,
  org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
    AND p.resource = resource_name
    AND p.action = action_name
    AND (org_id IS NULL OR ur.organization_id = org_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage in policies
CREATE POLICY "Users with 'read' permission can view projects"
  ON projects FOR SELECT
  USING (user_has_permission('projects', 'read', organization_id));

CREATE POLICY "Users with 'create' permission can insert projects"
  ON projects FOR INSERT
  WITH CHECK (user_has_permission('projects', 'create', organization_id));
```

---

## Hierarchical Data

### Pattern 5: Parent-Child Relationships

**Use Case:** Comments with replies, folders with subfolders

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Recursive function to check if user owns parent
CREATE OR REPLACE FUNCTION user_owns_comment_thread(comment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  parent_user_id UUID;
  parent_comment_id UUID;
BEGIN
  -- Get the comment's user_id and parent_id
  SELECT user_id, parent_id INTO parent_user_id, parent_comment_id
  FROM comments
  WHERE id = comment_id;

  -- If it's the user's comment, return true
  IF parent_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- If there's a parent, check recursively
  IF parent_comment_id IS NOT NULL THEN
    RETURN user_owns_comment_thread(parent_comment_id);
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can view comments on public posts
CREATE POLICY "Users can view comments on accessible posts"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND (posts.published = true OR posts.user_id = auth.uid())
    )
  );

-- Users can reply to their own comment threads
CREATE POLICY "Users can reply to own threads"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (parent_id IS NULL OR user_owns_comment_thread(parent_id))
  );
```

---

## Time-Based Access

### Pattern 6: Scheduled Content Access

**Use Case:** Content that becomes available/unavailable at specific times

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_enrollments (
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can only view courses they're enrolled in and that are currently available
CREATE POLICY "Users can view enrolled available courses"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = courses.id
      AND course_enrollments.user_id = auth.uid()
    )
    AND (available_from IS NULL OR available_from <= NOW())
    AND (available_until IS NULL OR available_until >= NOW())
  );
```

---

## Advanced Patterns

### Pattern 7: Conditional Access Based on Metadata

**Use Case:** Different access rules based on content type or status

```sql
CREATE TYPE content_visibility AS ENUM ('public', 'private', 'unlisted', 'members_only');

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  visibility content_visibility DEFAULT 'private',
  requires_subscription BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  user_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id)
);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Complex visibility rules"
  ON content FOR SELECT
  USING (
    -- Owner can always see
    user_id = auth.uid()
    OR
    -- Public content
    visibility = 'public'
    OR
    -- Unlisted with direct access (assume passed via URL)
    visibility = 'unlisted'
    OR
    -- Members-only content for authenticated users
    (visibility = 'members_only' AND auth.uid() IS NOT NULL)
    OR
    -- Subscription required content for active subscribers
    (
      requires_subscription = true
      AND EXISTS (
        SELECT 1 FROM subscriptions
        WHERE subscriptions.user_id = auth.uid()
        AND subscriptions.status = 'active'
        AND subscriptions.expires_at > NOW()
      )
    )
  );
```

### Pattern 8: Delegation/Sharing

**Use Case:** Users can share access to their resources with others

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_shares (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('view', 'edit')),
  shared_by UUID REFERENCES auth.users(id),
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (document_id, shared_with_user_id)
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Users can view documents they own or that are shared with them
CREATE POLICY "Users can view owned or shared documents"
  ON documents FOR SELECT
  USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = documents.id
      AND document_shares.shared_with_user_id = auth.uid()
    )
  );

-- Users can edit documents they own or have edit permission on
CREATE POLICY "Users can edit owned or editable documents"
  ON documents FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = documents.id
      AND document_shares.shared_with_user_id = auth.uid()
      AND document_shares.permission = 'edit'
    )
  );

-- Users can manage shares on their own documents
CREATE POLICY "Owners can manage shares"
  ON document_shares FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_shares.document_id
      AND documents.owner_id = auth.uid()
    )
  );
```

---

## Testing RLS

### Testing Framework

```typescript
// tests/rls-policies.test.ts
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('RLS Policies', () => {
  let adminClient: ReturnType<typeof createClient>
  let user1Client: ReturnType<typeof createClient>
  let user2Client: ReturnType<typeof createClient>
  let user1Id: string
  let user2Id: string

  beforeAll(async () => {
    // Admin client with service role
    adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create test users
    const { data: user1Data } = await adminClient.auth.admin.createUser({
      email: 'user1@test.com',
      password: 'password123',
      email_confirm: true,
    })
    user1Id = user1Data.user!.id

    const { data: user2Data } = await adminClient.auth.admin.createUser({
      email: 'user2@test.com',
      password: 'password123',
      email_confirm: true,
    })
    user2Id = user2Data.user!.id

    // Create clients for users
    const { data: { session: session1 } } = await adminClient.auth.signInWithPassword({
      email: 'user1@test.com',
      password: 'password123',
    })

    const { data: { session: session2 } } = await adminClient.auth.signInWithPassword({
      email: 'user2@test.com',
      password: 'password123',
    })

    user1Client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session1!.access_token}`,
          },
        },
      }
    )

    user2Client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session2!.access_token}`,
          },
        },
      }
    )
  })

  it('should allow users to read their own posts', async () => {
    // Create post as user1
    const { data: post } = await user1Client
      .from('posts')
      .insert({ title: 'Test Post', user_id: user1Id })
      .select()
      .single()

    // User1 should be able to read it
    const { data, error } = await user1Client
      .from('posts')
      .select('*')
      .eq('id', post!.id)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('should prevent users from reading other users private posts', async () => {
    // Create private post as user1
    const { data: post } = await user1Client
      .from('posts')
      .insert({ title: 'Private Post', user_id: user1Id, published: false })
      .select()
      .single()

    // User2 should NOT be able to read it
    const { data, error } = await user2Client
      .from('posts')
      .select('*')
      .eq('id', post!.id)

    expect(data).toHaveLength(0)
  })

  it('should allow users to read published posts', async () => {
    // Create published post as user1
    const { data: post } = await user1Client
      .from('posts')
      .insert({ title: 'Public Post', user_id: user1Id, published: true })
      .select()
      .single()

    // User2 SHOULD be able to read it
    const { data, error } = await user2Client
      .from('posts')
      .select('*')
      .eq('id', post!.id)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  afterAll(async () => {
    // Clean up test users
    await adminClient.auth.admin.deleteUser(user1Id)
    await adminClient.auth.admin.deleteUser(user2Id)
  })
})
```

---

## Performance Optimization

### 1. Add Indexes on Foreign Keys

```sql
-- Always index columns used in RLS policies
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_published_idx ON posts(published) WHERE published = true;
CREATE INDEX org_members_user_id_idx ON organization_members(user_id);
CREATE INDEX org_members_org_id_idx ON organization_members(organization_id);
```

### 2. Use SECURITY DEFINER Functions

```sql
-- Mark helper functions as SECURITY DEFINER for better performance
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 3. Avoid Complex Joins in Policies

```sql
-- BAD: Complex subquery in policy
CREATE POLICY "bad_policy"
  ON posts FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM organization_members
      WHERE organization_id IN (
        SELECT id FROM organizations WHERE ...
      )
    )
  );

-- GOOD: Use helper function
CREATE POLICY "good_policy"
  ON posts FOR SELECT
  USING (is_organization_member(organization_id));
```

### 4. Use Partial Indexes

```sql
-- Index only published posts for faster public queries
CREATE INDEX posts_published_idx ON posts(id) WHERE published = true;
```

---

## Debugging RLS

### Enable RLS Logging

```sql
-- Check which policies are applied
SELECT * FROM pg_policies WHERE tablename = 'posts';

-- Test policy as specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-uuid-here';
SELECT * FROM posts;
RESET role;
```

### Common Issues

1. **Policy too restrictive**: Use `OR` to combine multiple conditions
2. **Missing indexes**: Always index foreign keys used in policies
3. **Circular dependencies**: Avoid policies that reference each other
4. **Performance**: Use `SECURITY DEFINER` functions for complex checks

---

## Best Practices

1. ✅ **Always enable RLS** on tables with user data
2. ✅ **Test policies thoroughly** with multiple user contexts
3. ✅ **Use helper functions** for complex logic
4. ✅ **Add indexes** on columns used in policies
5. ✅ **Keep policies simple** and readable
6. ✅ **Document your policies** with comments
7. ✅ **Use transactions** when creating related records
8. ✅ **Audit policies regularly** for security
