# Manual Testing Guide

Since the automated tests have issues with login persistence, here's how to test manually:

## Setup

1. Open TWO browser windows side-by-side
2. **Left window:** `http://localhost:8000/host.html?s=test`
3. **Right window:** `http://localhost:8000/index.html?s=test`

## Test Flow

### Step 1: Host Login
- In the **host window**, log in with:
  - Email: `flavius.kehr@sap.com`
  - Password: `MeinPasswort`
- You should see host controls at the top

### Step 2: Check Initial State
**Host should show:**
- Node: intro
- Status: story
- Orange "Next" button enabled

**Participant should show:**
- Title: "Base camp"
- Story text visible
- NO "Waiting for host..." message

✓ If both look correct, continue.

### Step 3: Advance to First Question
- In **host window**, click **"Next"** button

**Both windows should update to:**
- Title: "The first decision"
- Question: "Would you rather plan ahead or improvise?"

**Participant should show:**
- Two vote buttons: "Plan ahead" (A) and "Improvise" (B)

**Host should show:**
- Node: d1
- Status: open
- Orange "Close Voting" button enabled
- Live vote count (initially "A: 0 | B: 0")

✓ If this works, continue.

### Step 4: Participant Votes
- In **participant window**, click one of the vote buttons (A or B)

**Participant should show:**
- Selected button has orange border
- Message: "Vote recorded"

**Host should show:**
- Live vote count updates (e.g., "A: 1 | B: 0")

✓ If vote appears in host view, continue.

### Step 5: Host Closes Voting
- In **host window**, click **"Close Voting"**

**Expected behavior (THIS IS WHERE THE BUG MIGHT BE):**

**Host should show:**
- Node: d1
- Status: **closed** (NOT "open")
- Result bars showing percentages
- A button like "Continue to: A bear on the ridge" OR two buttons "Go with A" / "Go with B"

**Participant should show:**
- Vote buttons GONE
- Result bars showing percentages
- Winner marked with checkmark

## Debugging Step 5

If Close Voting doesn't work:

1. Open browser Developer Console (F12) in **host window**
2. Run this command:

```javascript
import('./js/firebase.js').then(async ({ database, ref, get }) => {
  const sessionRef = ref(database, 'sessions/test');
  const snapshot = await get(sessionRef);
  console.log('Session state:', JSON.stringify(snapshot.val(), null, 2));
});
```

3. Tell me what the output shows - specifically what the "status" field says.

## What to Report

Tell me at which step it fails and exactly what you see vs. what should happen.
