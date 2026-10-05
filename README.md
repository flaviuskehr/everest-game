# Everest, Together

A live voting game for team summits. Your team climbs Mount Everest together through a branching story, voting on decisions that reveal work styles and spark discussion.

**Live Demo:** [Add your GitHub Pages URL here]

## Features

- 🗳️ Real-time voting for up to 50+ participants
- 📱 Works on any device with a web browser
- 🎨 Everest-themed design with full-screen images
- 📊 Live results and path summary
- 🎯 "Closest call" analysis for discussion starters
- 🔒 Anonymous voting (even the host can't see who voted what)
- ✏️ Edit story without rebuilding - just edit `story.md` and reload

## Quick Start

### For Participants

1. Open the URL shared by your host (e.g., `https://username.github.io/everest-game/?s=summit`)
2. Vote when questions appear
3. See results after the host closes each vote

### For the Host

1. Open `host.html` and log in with your host credentials
2. Share the QR code or URL with participants
3. Click **Start** to begin
4. Click **Close Voting** when ready to see results
5. Click **Continue** to advance through the story

## Setup Instructions

This game requires a Firebase project for real-time voting. Follow these steps:

### 1. Firebase Setup (One-Time, ~10 minutes)

See **[FIREBASE-SETUP.md](FIREBASE-SETUP.md)** for detailed step-by-step instructions.

**Summary:**
1. Create a Firebase project with EU database region
2. Enable Anonymous Auth and Email/Password Auth
3. Create one host user and note their UID
4. Get your Firebase web config
5. Paste config into `js/firebase-config.js` (already done ✓)
6. Deploy security rules from `database.rules.json`
7. Add your GitHub Pages domain to authorized domains

### 2. Deploy to GitHub Pages

#### Option A: Using GitHub Website

1. Create a new repository on GitHub
2. Upload all files from this directory
3. Go to **Settings** → **Pages**
4. Set source to **main branch** / **root folder**
5. Click **Save**
6. Wait 1-2 minutes for deployment

#### Option B: Using Git

```bash
# Initialize and commit
git add .
git commit -m "Initial commit: Everest game"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR-USERNAME/everest-game.git
git branch -M main
git push -u origin main

# Enable GitHub Pages
# Go to: https://github.com/YOUR-USERNAME/everest-game/settings/pages
# Set source to: main branch / root folder
```

Your game will be live at: `https://YOUR-USERNAME.github.io/everest-game/`

### 3. Test Before the Event

1. Open `check.html` to verify story structure
2. Open `host.html` on one device and `index.html` on another
3. Run through the story to test voting
4. Optional: Use `test-load.js` to simulate 50 participants

## Story Editing

### Quick Edits (During Event)

1. Edit `story.md` on GitHub (or push changes)
2. Wait ~2 minutes for GitHub Pages to deploy
3. In host view, click **Reload Story**
4. Story updates without ending the session

### Story Format

See the [briefing](files/briefing.md) for complete format documentation.

**Basic structure:**
```markdown
## node-id | Node Title
image: images/photo.jpg
credit: Photo by Author, CC BY, source URL

Story text goes here. **Bold** and *italic* supported.

? Question text for voting
A: Option A label => target-node-id
B: Option B label => target-node-id
```

### Using Alternative Stories

Create a new story file (e.g., `story-short.md`) and load it with:
```
index.html?s=summit&story=story-short.md
host.html?s=summit&story=story-short.md
```

## Images

The game needs 18 images (several are reused). See [CREDITS.md](CREDITS.md) for the full list.

**To add images:**
1. Find suitable images on [Wikimedia Commons](https://commons.wikimedia.org/)
2. Download at ~1600px width, compress to < 300KB
3. Save to `/images` directory
4. Update `credit:` lines in `story.md`
5. Update `CREDITS.md` with proper attribution

**License requirements:** Public domain (CC0), CC BY, or CC BY-SA only.

## Running Multiple Sessions

Use different session codes for parallel or repeat sessions:

- First session: `?s=summit1`
- Second session: `?s=summit2`
- Testing: `?s=test`

Each session maintains independent votes and state.

To reuse a session, click **Reset Session** in the host view.

## Troubleshooting

### "Permission denied" errors
- Verify your host UID in `database.rules.json` matches your Firebase user
- Check that security rules are published in Firebase Console
- Make sure you're logged in as the host

### Votes not updating in real-time
- Check browser console for WebSocket errors
- Verify `databaseURL` in `firebase-config.js` is correct
- Some corporate firewalls block WebSockets - test on mobile data

### Images not loading
- Check that image files exist in `/images` directory
- Verify GitHub Pages has finished deploying (takes 1-2 minutes)
- Check browser console for 404 errors

### "Auth domain not authorized"
- Add your GitHub Pages domain to Firebase authorized domains
- Settings → Authentication → Settings → Authorized domains

### Story changes not showing
- Wait 2 minutes after pushing to GitHub
- Click **Reload Story** in host view
- Check `check.html` for parsing errors
- Clear browser cache if needed

## Testing with Multiple Participants

### Manual Testing
Open the participant URL in multiple browser windows or devices.

### Load Testing
Use the provided Node.js script to simulate many participants:

```bash
npm install firebase
node test-load.js
```

Edit `test-load.js` to change the number of simulated participants.

## Project Structure

```
/
├── index.html              Participant view
├── host.html               Host control panel
├── check.html              Story validation tool
├── story.md                The story (edit this!)
├── css/
│   └── style.css           All styles
├── js/
│   ├── app-participant.js  Participant logic
│   ├── app-host.js         Host logic
│   ├── story-parser.js     Story parser (testable)
│   ├── firebase.js         Firebase initialization
│   ├── firebase-config.js  Your Firebase config
│   └── strings.js          UI text (for translation)
├── images/                 Story images
├── database.rules.json     Firebase security rules
├── FIREBASE-SETUP.md       Firebase setup guide
├── CREDITS.md              Image attributions
└── README.md               This file
```

## Technical Details

- **Frontend:** Plain HTML, CSS, ES modules (no build step)
- **Backend:** Firebase Realtime Database (free tier)
- **Auth:** Anonymous for participants, Email/Password for host
- **Hosting:** GitHub Pages (static)
- **Browser Support:** Modern Chrome, Safari, Firefox

## Security & Privacy

- ✅ Votes are anonymous - host cannot see who voted what
- ✅ Only aggregate counts are stored and displayed
- ✅ Firebase config is safe to commit (security comes from rules)
- ✅ Only the authenticated host can control the game
- ✅ Participants use anonymous authentication
- ❌ No personal data collected
- ❌ No analytics or tracking

## License

This game code is provided as-is. Images must be individually licensed - see CREDITS.md.

## Credits

Built for team summits. Designed for psychological safety in voting about work styles, feedback, and collaboration preferences.

---

## FAQ

**Q: Can I run this without Firebase?**  
A: No, Firebase provides the real-time sync needed for voting. The free tier is sufficient for most events.

**Q: How much does Firebase cost?**  
A: The free Spark plan covers 100 simultaneous connections and 10GB/month transfer. A 50-person, 15-minute session uses < 1% of this.

**Q: Can participants see each other's votes?**  
A: No. Only aggregate counts are shown, and only after the host closes voting.

**Q: What happens if someone votes twice?**  
A: Each browser/device gets one anonymous identity. Changing votes is allowed while voting is open.

**Q: Can I customize the story?**  
A: Yes! Edit `story.md`. The format is simple and documented in the briefing.

**Q: Do I need to rebuild after editing the story?**  
A: No. Just push the change to GitHub, wait ~2 minutes, and click "Reload Story" in the host view.

**Q: Can I use this for more than 50 people?**  
A: Yes, Firebase free tier supports 100 simultaneous connections. Test with your expected audience size first.

**Q: What if my session gets interrupted?**  
A: The host can click "Back" to return to previous nodes, or "Reset Session" to start fresh.

**Q: Can I see the full story graph?**  
A: Yes, open `check.html` to see the story map, check for errors, and walk through all paths.
