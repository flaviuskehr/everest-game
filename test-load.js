// Load test script - simulates multiple participants voting
// Usage: node test-load.js

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// IMPORTANT: Update this with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBYNrC5mVPZoPXna4X4nKz_uRUnTAOp1kY",
  authDomain: "everest-c3ad6.firebaseapp.com",
  databaseURL: "https://everest-c3ad6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "everest-c3ad6",
  storageBucket: "everest-c3ad6.firebasestorage.app",
  messagingSenderId: "59294168919",
  appId: "1:59294168919:web:d768db62234cfb0a9df012"
};

const SESSION_ID = 'test'; // Change to match your session
const NUM_PARTICIPANTS = 50; // Number of simulated participants

class SimulatedParticipant {
  constructor(id) {
    this.id = id;
    this.app = initializeApp(firebaseConfig, `participant-${id}`);
    this.auth = getAuth(this.app);
    this.database = getDatabase(this.app);
    this.currentNode = null;
    this.currentRound = null;
  }

  async init() {
    await signInAnonymously(this.auth);
    console.log(`Participant ${this.id}: Authenticated as ${this.auth.currentUser.uid}`);

    // Listen to session state
    const sessionRef = ref(this.database, `sessions/${SESSION_ID}`);
    onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const session = snapshot.val();
        this.handleSessionUpdate(session);
      }
    });

    // Set presence
    const presenceRef = ref(this.database, `presence/${SESSION_ID}/${this.auth.currentUser.uid}`);
    await set(presenceRef, true);
  }

  handleSessionUpdate(session) {
    const { currentNode, status, round } = session;

    // Check if this is a new question
    if (status === 'open' && (currentNode !== this.currentNode || round !== this.currentRound)) {
      this.currentNode = currentNode;
      this.currentRound = round;

      // Vote after a random delay (simulate human behavior)
      const delay = Math.random() * 3000 + 500; // 0.5-3.5 seconds
      setTimeout(() => this.vote(), delay);
    }
  }

  async vote() {
    // Randomly choose A or B with slight bias toward A (60/40)
    const choice = Math.random() < 0.6 ? 'A' : 'B';

    const voteRef = ref(
      this.database,
      `votes/${SESSION_ID}/${this.currentNode}/${this.currentRound}/${this.auth.currentUser.uid}`
    );

    try {
      await set(voteRef, choice);
      console.log(`Participant ${this.id}: Voted ${choice} on ${this.currentNode} (round ${this.currentRound})`);
    } catch (error) {
      console.error(`Participant ${this.id}: Vote failed:`, error.message);
    }
  }
}

async function main() {
  console.log(`Starting load test with ${NUM_PARTICIPANTS} participants...`);
  console.log(`Session: ${SESSION_ID}`);
  console.log(`Make sure the host has started the session at host.html?s=${SESSION_ID}\n`);

  const participants = [];

  // Create and initialize all participants
  for (let i = 1; i <= NUM_PARTICIPANTS; i++) {
    const participant = new SimulatedParticipant(i);
    participants.push(participant);

    // Stagger initialization to avoid overwhelming Firebase
    await new Promise(resolve => setTimeout(resolve, 100));
    await participant.init();
  }

  console.log(`\n✓ All ${NUM_PARTICIPANTS} participants are connected and ready!`);
  console.log('They will automatically vote when questions are opened.');
  console.log('Press Ctrl+C to stop.\n');

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\nStopping load test...');
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Load test failed:', error);
  process.exit(1);
});
