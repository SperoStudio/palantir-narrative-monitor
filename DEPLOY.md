# Deployment Guide — Narrative Environment Monitor

End-to-end this takes about 20 minutes. Do the steps in order.

---

## Step 1 — Create your Supabase database

Supabase is where the dashboard stores its data. You need a free account.

1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Click the green **New project** button.
3. Fill in the form:
   - **Name:** anything you want, e.g. `palantir-monitor`
   - **Database password:** click **Generate a password**, then copy it somewhere (a notes app is fine — you may never need it again but Supabase requires it)
   - **Region:** `East US (North Virginia)` is a safe default
4. Click **Create new project**.
5. Wait about 2 minutes. You'll see a loading spinner — wait until you see your project dashboard.

---

## Step 2 — Create the database table

1. In the left sidebar of your Supabase project, click **SQL Editor**.
2. Click the **+ New query** button in the top left of that page.
3. A code editor opens with a blank slate. Click inside it and press `Cmd+A` to select everything, then `Delete` to make sure it's completely empty.
4. Open the file called `supabase_schema.sql` from your project folder on your computer. Open it in any text editor (TextEdit, VS Code, anything). Select all the text (`Cmd+A`) and copy it (`Cmd+C`).
5. Click back into the Supabase editor and paste (`Cmd+V`).
6. Click the green **Run** button (or press `Cmd+Enter`).
7. At the bottom of the screen you should see: **Success. No rows returned.**

That's it — your database is ready.

---

## Step 3 — Collect your Supabase keys

Your app needs three pieces of information from Supabase to connect to the database. Here's exactly where to find them:

1. In your Supabase project, click **Project Settings** in the very bottom of the left sidebar (it looks like a gear icon).
2. In the Settings menu that appears, click **API**.
3. You'll see a page with a few sections. Here's what to copy from each:

**Value 1 — Project URL**
Look for the section called **Project URL**. Copy the URL that looks like:
`https://abcdefghijklmno.supabase.co`
→ This is your `NEXT_PUBLIC_SUPABASE_URL`

**Value 2 — Anon key**
Scroll down to the section called **Project API keys**. You'll see two keys. Copy the one labeled **anon** / **public**. It's a long string starting with `eyJ`.
→ This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Value 3 — Service role key**
Right below the anon key is one labeled **service_role**. It's hidden by default. Click the **eye icon** to reveal it, then copy it. It also starts with `eyJ` but is a different value.
→ This is your `SUPABASE_SERVICE_ROLE_KEY`

Paste all three somewhere you can get to them (a private note, a password manager, etc.) — you'll need them in Step 5.

---

## Step 4 — Get your Anthropic API key

This is the key that lets the dashboard call Claude to fetch live news.

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in.
2. Click **API Keys** in the left sidebar.
3. Click **Create Key**.
4. Give it a name like `palantir-monitor` and click **Create Key**.
5. Copy the key — it starts with `sk-ant-`. **This is the only time you'll see it**, so paste it somewhere safe now.

→ This is your `ANTHROPIC_API_KEY`

> Note: The live web search feature requires a paid Anthropic account. If you're on a free tier the fetch will fail — upgrade at [console.anthropic.com/settings/billing](https://console.anthropic.com/settings/billing).

---

## Step 5 — Add your keys to the project

Now you'll create a file that stores all your keys so the app can use them when running on your computer.

1. Open your project folder (`palantir-narrative-monitor`) in VS Code or any editor.
2. You'll see a file called `.env.local.example`. Duplicate it and rename the copy to `.env.local` (remove the word "example" — the dot at the start is important, keep that).
3. Open `.env.local`. It looks like this:

```
ANTHROPIC_API_KEY=sk-ant-...

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

CRON_SECRET=a-long-random-string
```

4. Replace each placeholder value with the real values you collected in Steps 3 and 4.

5. For `CRON_SECRET`, open your Terminal and run:
```bash
openssl rand -hex 32
```
Copy the string it prints and paste it as the value for `CRON_SECRET`. It's just a private password that keeps the scheduled job secure.

6. Save the file.

---

## Step 6 — Test that everything works on your computer

1. Open Terminal, navigate to the project folder:
```bash
cd ~/Desktop/palantir-narrative-monitor
```

2. Start the app:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the dashboard showing placeholder demo data.

4. Now test the live data fetch. Open a **second** Terminal window (leave the first one running) and paste this command:
```bash
curl -X POST http://localhost:3000/api/fetch-sentiment
```

5. Wait 15–30 seconds. Claude is reading live news. When it finishes, you'll see something like:
```
{"ok":true,"narrativeHealth":71}
```

6. Go back to the browser and reload the page. The dashboard should now show real data with today's actual Palantir news. The timestamp in the top right will update.

If you see an error in the Terminal instead, the most common causes are:
- Typo in one of the keys in `.env.local` — double-check them
- Anthropic account isn't on a paid plan — check billing at console.anthropic.com

---

## Step 7 — Deploy to Vercel

Vercel is where the app lives on the internet.

### Install the Vercel command-line tool

In Terminal:
```bash
npm i -g vercel
```

### Log in to Vercel
```bash
vercel login
```
It will open a browser window — log in with your Vercel account (or create one free at vercel.com).

### Deploy for the first time
Make sure you're in the project folder in Terminal, then run:
```bash
vercel
```

It will ask you a few questions — answer them like this:
- `Set up and deploy?` → press **Enter** (yes)
- `Which scope?` → press **Enter** to select your personal account
- `Link to existing project?` → type `N` and press Enter
- `What's your project's name?` → press **Enter** to accept the default
- `In which directory is your code located?` → press **Enter** (it shows `./`)

It will build and deploy. At the end it prints a URL like `https://palantir-narrative-monitor-abc123.vercel.app`. That's your live site — but it won't have your keys yet, so let's add those now.

### Add your keys to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) in your browser.
2. Click on your `palantir-narrative-monitor` project.
3. Click the **Settings** tab at the top.
4. In the left sidebar under Settings, click **Environment Variables**.
5. Add each of these one at a time. For each one: type the name in the **Key** field, paste the value in the **Value** field, make sure all three checkboxes (Production, Preview, Development) are checked, then click **Save**.

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | your `sk-ant-...` key |
| `NEXT_PUBLIC_SUPABASE_URL` | your `https://...supabase.co` URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your long `eyJ...` anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your long `eyJ...` service role key |
| `CRON_SECRET` | the random string you generated in Step 5 |

### Redeploy with the keys active

Back in Terminal:
```bash
vercel --prod
```

This runs a fresh deployment that now has access to all your keys. When it finishes it will print your final production URL.

---

## Step 8 — Confirm the scheduled auto-refresh is working

The dashboard is set to automatically pull fresh news every 4 hours. To confirm it's set up:

1. In the Vercel dashboard, click on your project.
2. Click **Settings** → look in the left sidebar for **Cron Jobs**.
3. You should see one job listed: schedule `0 */4 * * *` pointing to `/api/fetch-sentiment`.

To test it right now without waiting 4 hours, click **Run** next to the cron job. Or just use the **Refresh** button on the live dashboard — both do the same thing.

---

## Step 9 — Final check

1. Open your live Vercel URL.
2. Click the **Refresh** button on the dashboard.
3. It should spin for about 20 seconds, then show updated data with a fresh timestamp.

You're live. The dashboard will now auto-update every 4 hours on its own.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| Dashboard shows demo data and never updates | Click Refresh. If it errors, check that all 5 env vars are set correctly in Vercel and that you redeployed after adding them. |
| "Unauthorized" error on Refresh | The `CRON_SECRET` in Vercel doesn't match the one in your `.env.local`. Update the one in Vercel to match and redeploy. |
| Refresh spins forever then errors | Check Vercel → your project → **Logs** tab to see the exact error message. |
| Chart only shows one dot | You need more snapshots. Click Refresh several times to build up history. The cron job will fill it in automatically over the next day or two. |
