# Supabase setup for Ceramics Gallery

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready

## 2. Run the schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run it

## 3. Create storage bucket

1. Go to **Storage** in the Supabase Dashboard
2. Click **New bucket**
3. Name: `product-images`
4. Set **Public bucket** to Yes
5. Create

Then add storage policies (Storage > Policies, or run in SQL Editor):

```sql
-- Allow authenticated users to upload
create policy "Authenticated can upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- Public can view
create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');
```

## 4. Environment variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Comma-separated list of admin emails (for /admin page)
ADMIN_EMAILS=admin@example.com
```

Get these from **Project Settings** > **API** in the Supabase Dashboard:
- **Project URL** and **anon public** (or **Publishable key**) for the first two
- **service_role** for the third: open the **Legacy API Keys** tab and copy the **service_role** key (a long JWT starting with `eyJ...`). This is different from the publishable key. Keep it secret and never expose to the client.

## 5. Email auth (optional)

For development, you may want to disable email confirmation:
**Authentication** > **Providers** > **Email** > disable "Confirm email"

## 6. Admin access

Admins can make potters active/inactive (hiding them from the catalog). To set up an admin:

### Step 1: Add admin email to .env.local

Open `.env.local` in your project root and add (or update) the line:

```
ADMIN_EMAILS=you@example.com
```

For multiple admins, use commas:

```
ADMIN_EMAILS=admin@example.com,owner@ceramicsgallery.co.uk
```

The email must match exactly (case-insensitive) the email used to log in.

### Step 2: Create the admin user in Supabase

The admin needs a Supabase auth account before they can log in:

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter the admin’s **Email** (same as in `ADMIN_EMAILS`)
4. Enter a **Password** (they can change it later via a password-reset flow if you add one)
5. Optionally uncheck **Auto Confirm User** if you want to confirm manually
6. Click **Create user**

### Step 3: Log in as admin

1. Restart your dev server (`Ctrl+C`, then `npm run dev`) so it picks up `ADMIN_EMAILS`
2. Go to `http://localhost:3000/login`
3. Log in with the admin email and password from Step 2
4. You’ll be redirected to `/admin` (instead of `/dashboard`)
5. The **Admin** link appears in the header when you’re logged in as an admin

### Admin and potter in one

If you add a potter’s email to `ADMIN_EMAILS`, they get both **Dashboard** (as a potter) and **Admin** in the header after logging in.

### Troubleshooting: login redirects back to login page

- **Check `ADMIN_EMAILS`** – The email must match the Supabase user email exactly (case-insensitive). Restart the dev server after changing env vars.
- **Confirm the user** – When adding a user in Supabase, enable **Auto Confirm User** so they can log in without email verification.

## 7. Migrations (if you already ran the base schema)

Run in SQL Editor if your tables were created before these features:

```sql
-- Potter active/inactive
alter table potters add column if not exists active boolean not null default true;

-- Product active/inactive
alter table products add column if not exists active boolean not null default true;
```

## 8. Install and run

```bash
npm install
npm run dev
```

Then visit `/signup` to create a potter account, `/dashboard` to add products, or `/admin` (with an admin email in `ADMIN_EMAILS`) to manage potter visibility.
