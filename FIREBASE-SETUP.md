# Firebase Setup Guide

Follow these steps to set up Firebase for the Everest game. This should take about 10 minutes.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., `everest-team-game`)
4. **Disable Google Analytics** (not needed for this project) or accept the defaults
5. Click **"Create project"** and wait for it to finish

---

## Step 2: Set Up Realtime Database

1. In the Firebase Console, click **"Realtime Database"** in the left sidebar (under "Build")
2. Click **"Create Database"**
3. **IMPORTANT**: Choose a location in **Europe** (e.g., `europe-west1`)
4. Start in **"Locked mode"** (we'll add custom rules in a moment)
5. Click **"Enable"**

---

## Step 3: Enable Authentication

### Enable Anonymous Auth (for participants)

1. Click **"Authentication"** in the left sidebar
2. Click **"Get started"** if this is your first time
3. Go to the **"Sign-in method"** tab
4. Click on **"Anonymous"**
5. Toggle **"Enable"** and click **"Save"**

### Enable Email/Password Auth (for host)

1. Still in **"Sign-in method"** tab
2. Click on **"Email/Password"**
3. Toggle **"Enable"** (the first toggle, NOT "Email link")
4. Click **"Save"**

### Create the Host User

1. Go to the **"Users"** tab in Authentication
2. Click **"Add user"**
3. Enter:
   - **Email**: Your email (e.g., `host@yourcompany.com`)
   - **Password**: A strong password (save this - you'll need it to log into host.html)
4. Click **"Add user"**
5. **COPY THE USER UID** - you'll see it in the User UID column (looks like `xK7Jm9pQa2bC3dE4fG5hI6jK7lM8nO9`)
   - OR just remember the email address - we'll use one of these in the security rules

---

## Step 4: Get Your Firebase Web Config

1. Go to **Project Settings** (click the gear icon ⚙️ near "Project Overview")
2. Scroll down to **"Your apps"**
3. Click the **web icon** `</>` (labeled "Web")
4. Register the app:
   - **App nickname**: `everest-game` (any name is fine)
   - **Don't check** "Also set up Firebase Hosting"
   - Click **"Register app"**
5. You'll see a code snippet that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "everest-team-game.firebaseapp.com",
  databaseURL: "https://everest-team-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "everest-team-game",
  storageBucket: "everest-team-game.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

6. **COPY THIS ENTIRE CONFIG OBJECT** (you'll paste it into the code in Step 6)

---

## Step 5: Deploy Security Rules

1. Still in Firebase Console, go back to **"Realtime Database"**
2. Click the **"Rules"** tab
3. **Delete everything** in the rules editor
4. **Copy and paste** the rules from `database.rules.json` in the game repository
5. **IMPORTANT**: Replace `YOUR_HOST_EMAIL_HERE` with your actual host email from Step 3
   - Find this line: `".read": "auth.token.email === 'YOUR_HOST_EMAIL_HERE'"`
   - Replace with: `".read": "auth.token.email === 'host@yourcompany.com'"`
   - Do the same for all instances of `YOUR_HOST_EMAIL_HERE`
6. Click **"Publish"**

### Alternative: Use UID instead of email

If you'd rather use the UID:
- Replace `auth.token.email === 'host@yourcompany.com'` 
- With `auth.uid === 'xK7Jm9pQa2bC3dE4fG5hI6jK7lM8nO9'` (your copied UID)

---

## Step 6: Configure the Game

1. Open `js/firebase-config.js` in the game repository
2. Paste your Firebase config from Step 4:

```javascript
// js/firebase-config.js
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "everest-team-game.firebaseapp.com",
  databaseURL: "https://everest-team-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "everest-team-game",
  storageBucket: "everest-team-game.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

---

## Step 7: Add Authorized Domain for GitHub Pages

1. In Firebase Console, go to **"Authentication"** → **"Settings"** tab
2. Scroll to **"Authorized domains"**
3. Click **"Add domain"**
4. Add your GitHub Pages domain: `YOUR-USERNAME.github.io`
   - Example: `johndoe.github.io`
5. Click **"Add"**

**Note**: `localhost` is already authorized for testing.

---

## Step 8: Test Locally

1. Run a local web server in the game directory:
   ```bash
   python3 -m http.server 8000
   # or
   npx serve
   ```

2. Open `http://localhost:8000/host.html`
3. Log in with your host email and password
4. Open `http://localhost:8000/index.html?s=test` in another browser window
5. Try starting the game and voting

If you see errors, check the browser console (F12) for Firebase error messages.

---

## Step 9: Deploy to GitHub Pages

1. Push your repository to GitHub
2. Go to your repository on GitHub.com
3. Click **"Settings"** → **"Pages"** (in the left sidebar)
4. Under **"Source"**, select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **"Save"**
6. Wait 1-2 minutes for deployment
7. Your game will be at: `https://YOUR-USERNAME.github.io/REPO-NAME/`

---

## Troubleshooting

### "Permission denied" errors
- Check that your security rules were published correctly
- Verify the host email/UID in the rules matches exactly
- Make sure you're logged in as the host in host.html

### "Auth domain not authorized"
- Add your GitHub Pages domain to authorized domains (Step 7)
- For custom domains, add those too

### Votes not appearing in real-time
- Check browser console for WebSocket errors
- Verify the `databaseURL` in your config is correct
- Make sure you're on a stable network (some corporate firewalls block WebSocket)

### "Failed to fetch story.md"
- Make sure `story.md` is in the root of your repository
- Check that GitHub Pages has finished deploying (can take 2 minutes after push)
- Try the "Reload story" button in host view

### Firebase quota exceeded
- The free Spark plan allows:
  - 100 simultaneous connections
  - 10 GB/month data transfer
  - For 50 participants in a 15-minute session, you'll use < 1% of this

### Testing with multiple participants
- Open the participant URL in multiple browser windows/devices
- Each browser/device gets a unique anonymous auth user
- Use the provided load test script to simulate many participants

---

## Security Notes

- ✅ Your Firebase config is **safe to commit** - it's public by design
- ❌ **Never commit** your host password
- ✅ Security comes from the database rules, not from hiding the config
- ✅ Participant votes are anonymous - the host cannot see who voted what
- ✅ Only the authenticated host can advance the game or close voting

---

## After the Event

If you want to reuse the setup for another session:

1. In host view, click **"Reset session"** to clear all votes and history
2. Change the session code in the URL: `?s=summit2` for a fresh session
3. No other Firebase changes needed

To fully delete everything:
1. Firebase Console → Project Settings → General
2. Scroll down and click **"Delete project"**
