// Host view application
import { parseStory, renderMarkdown } from './story-parser.js';
import {
  auth,
  database,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  ref,
  set,
  get,
  onValue,
  getSessionId,
  getStoryFile,
  loadStory,
  sessionPath,
  votesPath,
  presencePath
} from './firebase.js';
import { strings } from './strings.js';

let story = null;
let sessionId = null;
let currentUser = null;
let currentNode = null;
let sessionData = null;
let presenterMode = false;

// Initialize
function init() {
  sessionId = getSessionId();

  // Setup login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Check auth state
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await initHost();
    } else {
      showLogin();
    }
  });
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    errorEl.textContent = `Login failed: ${error.message}`;
    errorEl.style.display = 'block';
  }
}

// Handle logout
async function handleLogout() {
  await signOut(auth);
  showLogin();
}

// Show login screen
function showLogin() {
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('hostView').style.display = 'none';
}

// Initialize host view
async function initHost() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('hostView').style.display = 'block';

  // Load story
  try {
    await loadStoryData();
  } catch (error) {
    alert(`Failed to load story: ${error.message}`);
    return;
  }

  // Display session info
  document.getElementById('sessionCode').textContent = sessionId;

  // Generate QR code and join URL
  const joinUrl = `${window.location.origin}${window.location.pathname.replace('host.html', 'index.html')}?s=${sessionId}`;
  document.getElementById('joinUrl').textContent = joinUrl;
  generateQRCode(joinUrl);

  // Setup presenter mode toggle
  setupPresenterMode();

  // Listen to session
  listenToSession();

  // Setup control buttons
  setupControls();
}

// Load story data
async function loadStoryData() {
  const storyMd = await loadStory(getStoryFile());
  story = parseStory(storyMd);

  if (story.errors.length > 0) {
    throw new Error(`Story has ${story.errors.length} errors. Check check.html for details.`);
  }
}

// Generate QR code
function generateQRCode(url) {
  const qrEl = document.getElementById('qrCode');
  // Simple QR code using qrcodejs from CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
  script.onload = () => {
    new QRCode(qrEl, {
      text: url,
      width: 200,
      height: 200
    });
  };
  document.head.appendChild(script);
}

// Setup presenter mode
function setupPresenterMode() {
  const toggle = document.createElement('button');
  toggle.className = 'btn btn-secondary';
  toggle.textContent = strings.presenterMode;
  toggle.addEventListener('click', () => {
    presenterMode = !presenterMode;
    document.body.classList.toggle('presenter-mode', presenterMode);
  });

  const controlsHeader = document.querySelector('.host-header');
  controlsHeader.appendChild(toggle);
}

// Listen to session state
function listenToSession() {
  const sessionRef = ref(database, sessionPath(sessionId));

  onValue(sessionRef, async (snapshot) => {
    if (snapshot.exists()) {
      sessionData = snapshot.val();
    } else {
      sessionData = null;
    }

    await renderHostView();
  });
}

// Setup control buttons
function setupControls() {
  const controlsEl = document.getElementById('controlButtons');

  // Clear existing buttons to prevent duplicates
  if (controlsEl.dataset.initialized === 'true') {
    return; // Already set up
  }
  controlsEl.dataset.initialized = 'true';

  // Start button
  const startBtn = createButton('Start', 'btn-primary', async () => {
    await startSession();
  });

  // Next button
  const nextBtn = createButton('Next', 'btn-primary', async () => {
    await advanceToNext();
  });

  // Close voting button
  const closeBtn = createButton('Close Voting', 'btn-primary', async () => {
    await closeVoting();
  });

  // Reopen voting button
  const reopenBtn = createButton('Reopen Voting', 'btn-secondary', async () => {
    await reopenVoting();
  });

  // Back button
  const backBtn = createButton('Back', 'btn-outline', async () => {
    await goBack();
  });

  // Reset session button
  const resetBtn = createButton('Reset Session', 'btn-danger', async () => {
    if (confirm('Reset session? This will clear all votes and history.')) {
      await resetSession();
    }
  });

  // Reload story button
  const reloadBtn = createButton('Reload Story', 'btn-outline', async () => {
    try {
      await loadStoryData();
      alert('Story reloaded successfully!');
      await renderHostView();
    } catch (error) {
      alert(`Failed to reload story: ${error.message}`);
    }
  });

  controlsEl.appendChild(startBtn);
  controlsEl.appendChild(nextBtn);
  controlsEl.appendChild(closeBtn);
  controlsEl.appendChild(reopenBtn);
  controlsEl.appendChild(backBtn);
  controlsEl.appendChild(resetBtn);
  controlsEl.appendChild(reloadBtn);

  // Store references for enabling/disabling
  controlsEl.dataset.startBtn = 'Start';
  controlsEl.dataset.nextBtn = 'Next';
  controlsEl.dataset.closeBtn = 'Close Voting';
  controlsEl.dataset.reopenBtn = 'Reopen Voting';
  controlsEl.dataset.backBtn = 'Back';
}

// Create button helper
function createButton(text, className, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.className = `btn ${className}`;
  btn.addEventListener('click', onClick);
  return btn;
}

// Render host view
async function renderHostView() {
  const controlsEl = document.getElementById('controlButtons');
  const buttons = Array.from(controlsEl.querySelectorAll('.btn'));

  // Disable all buttons initially
  buttons.forEach(btn => btn.disabled = true);

  if (!sessionData || !sessionData.currentNode) {
    // No session started
    document.getElementById('currentNodeId').textContent = '—';
    document.getElementById('statusDisplay').textContent = 'Not started';

    // Enable Start button only
    buttons.find(b => b.textContent === 'Start').disabled = false;
    buttons.find(b => b.textContent === 'Reset Session').disabled = false;
    buttons.find(b => b.textContent === 'Reload Story').disabled = false;

    return;
  }

  currentNode = story.nodes[sessionData.currentNode];
  if (!currentNode) {
    alert(`Node ${sessionData.currentNode} not found in story`);
    return;
  }

  // Update status display
  document.getElementById('currentNodeId').textContent = currentNode.id;
  document.getElementById('statusDisplay').textContent = sessionData.status;

  // Render node content
  await renderNode();

  // Enable appropriate buttons
  buttons.find(b => b.textContent === 'Reset Session').disabled = false;
  buttons.find(b => b.textContent === 'Reload Story').disabled = false;

  if (sessionData.path && sessionData.path.length > 0) {
    buttons.find(b => b.textContent === 'Back').disabled = false;
  }

  if (currentNode.end) {
    // End node - no controls needed
    return;
  }

  if (currentNode.next) {
    // Story-only node
    buttons.find(b => b.textContent === 'Next').disabled = false;
  } else if (currentNode.question) {
    // Question node
    if (sessionData.status === 'open') {
      buttons.find(b => b.textContent === 'Close Voting').disabled = false;
      await showLiveVotes();
    } else if (sessionData.status === 'closed') {
      buttons.find(b => b.textContent === 'Reopen Voting').disabled = false;
      await renderContinueButtons();
    }
  }
}

// Render node content
async function renderNode() {
  // Update hero
  updateHero();

  // Story text
  const storyTextEl = document.getElementById('storyText');
  storyTextEl.innerHTML = renderMarkdown(currentNode.text);
  storyTextEl.style.display = 'block';

  // Hide sections
  document.getElementById('questionSection').style.display = 'none';
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('summarySection').style.display = 'none';

  // Show question if exists
  if (currentNode.question) {
    document.getElementById('questionText').textContent = currentNode.question;
    document.getElementById('questionSection').style.display = 'block';
  }

  // Show results if closed
  if (sessionData.status === 'closed' && currentNode.question) {
    await renderResults();
  }

  // Show summary if end node
  if (currentNode.end) {
    await renderSummary();
  }
}

// Update hero section
function updateHero() {
  const heroEl = document.getElementById('hero');
  const heroImageEl = document.getElementById('heroImage');
  const titleEl = document.getElementById('nodeTitle');
  const creditEl = document.getElementById('imageCredit');

  titleEl.textContent = currentNode.title;

  if (currentNode.metadata.image) {
    heroImageEl.src = currentNode.metadata.image;
    heroImageEl.alt = currentNode.title;
    heroEl.classList.remove('no-image');

    heroImageEl.onerror = () => {
      heroEl.classList.add('no-image');
      heroImageEl.style.display = 'none';
    };
  } else {
    heroEl.classList.add('no-image');
    heroImageEl.style.display = 'none';
  }

  if (currentNode.metadata.credit) {
    creditEl.textContent = currentNode.metadata.credit;
    creditEl.style.display = 'block';
  } else {
    creditEl.style.display = 'none';
  }
}

// Show live vote counts
async function showLiveVotes() {
  const liveCountEl = document.getElementById('liveVoteCount');
  const votesRef = ref(database, votesPath(sessionId, currentNode.id, sessionData.round));

  // Count participants
  const presenceRef = ref(database, `presence/${sessionId}`);
  const presenceSnapshot = await get(presenceRef);
  const totalParticipants = presenceSnapshot.exists() ? Object.keys(presenceSnapshot.val()).length : 0;

  onValue(votesRef, (snapshot) => {
    const counts = { A: 0, B: 0 };
    if (snapshot.exists()) {
      const votes = snapshot.val();
      for (const vote of Object.values(votes)) {
        if (vote === 'A') counts.A++;
        if (vote === 'B') counts.B++;
      }
    }

    const total = counts.A + counts.B;
    liveCountEl.innerHTML = `
      <strong>Live Votes:</strong> A: ${counts.A} | B: ${counts.B} |
      Total: ${total} of ${totalParticipants}
    `;
  });
}

// Render results after voting closed
async function renderResults() {
  const resultsSection = document.getElementById('resultsSection');
  const votesRef = ref(database, votesPath(sessionId, currentNode.id, sessionData.round));
  const votesSnapshot = await get(votesRef);

  const counts = { A: 0, B: 0 };
  if (votesSnapshot.exists()) {
    const votes = votesSnapshot.val();
    for (const vote of Object.values(votes)) {
      if (vote === 'A') counts.A++;
      if (vote === 'B') counts.B++;
    }
  }

  const total = counts.A + counts.B;

  resultsSection.innerHTML = '';

  for (const [option, data] of Object.entries(currentNode.options)) {
    const count = counts[option];
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const isWinner = option === sessionData.winner;

    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';

    const resultHeader = document.createElement('div');
    resultHeader.className = 'result-header';

    const label = document.createElement('div');
    label.className = `result-label ${isWinner ? 'winner' : ''}`;
    label.textContent = `${option}: ${data.label}`;

    const stats = document.createElement('div');
    stats.className = 'result-stats';
    stats.textContent = `${count} ${strings.votes} (${percent}%)`;

    resultHeader.appendChild(label);
    resultHeader.appendChild(stats);

    const barContainer = document.createElement('div');
    barContainer.className = 'result-bar-container';

    const bar = document.createElement('div');
    bar.className = `result-bar ${isWinner ? 'winner' : ''}`;
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;

    barContainer.appendChild(bar);
    resultItem.appendChild(resultHeader);
    resultItem.appendChild(barContainer);
    resultsSection.appendChild(resultItem);
  }

  resultsSection.style.display = 'block';
  document.getElementById('liveVoteCount').innerHTML = '';
}

// Render continue buttons after voting
async function renderContinueButtons() {
  const votesRef = ref(database, votesPath(sessionId, currentNode.id, sessionData.round));
  const votesSnapshot = await get(votesRef);

  const counts = { A: 0, B: 0 };
  if (votesSnapshot.exists()) {
    const votes = votesSnapshot.val();
    for (const vote of Object.values(votes)) {
      if (vote === 'A') counts.A++;
      if (vote === 'B') counts.B++;
    }
  }

  const total = counts.A + counts.B;
  const percentA = total > 0 ? Math.round((counts.A / total) * 100) : 50;
  const percentB = 100 - percentA;
  const diff = Math.abs(percentA - percentB);

  const controlsEl = document.getElementById('controlButtons');

  // Remove old continue buttons
  controlsEl.querySelectorAll('.continue-btn').forEach(btn => btn.remove());

  // Check for tie (within 5 percentage points)
  if (diff <= 5) {
    // Show both options
    const btnA = createButton(`Go with A: ${currentNode.options.A.label}`, 'btn-primary continue-btn', async () => {
      await continueToNode(currentNode.options.A.target, 'A', counts.A, counts.B);
    });

    const btnB = createButton(`Go with B: ${currentNode.options.B.label}`, 'btn-primary continue-btn', async () => {
      await continueToNode(currentNode.options.B.target, 'B', counts.A, counts.B);
    });

    controlsEl.appendChild(btnA);
    controlsEl.appendChild(btnB);
  } else {
    // Show winner
    const winner = sessionData.winner;
    const targetNode = currentNode.options[winner].target;
    const targetTitle = story.nodes[targetNode]?.title || targetNode;

    const continueBtn = createButton(`Continue to: ${targetTitle}`, 'btn-primary continue-btn', async () => {
      await continueToNode(targetNode, winner, counts.A, counts.B);
    });

    controlsEl.appendChild(continueBtn);
  }
}

// Session control functions
async function startSession() {
  const sessionRef = ref(database, sessionPath(sessionId));
  await set(sessionRef, {
    currentNode: story.meta.start,
    status: 'story',
    winner: null,
    round: 1,
    path: []
  });
}

async function advanceToNext() {
  if (!currentNode.next) return;

  const sessionRef = ref(database, sessionPath(sessionId));
  const nextNode = story.nodes[currentNode.next];

  await set(sessionRef, {
    ...sessionData,
    currentNode: currentNode.next,
    status: nextNode.question ? 'open' : 'story',
    winner: null,
    round: sessionData.round + 1
  });
}

async function closeVoting() {
  try {
    console.log('closeVoting: Starting...');
    console.log('closeVoting: sessionId=', sessionId, 'node=', currentNode.id, 'round=', sessionData.round);

    const votesRef = ref(database, votesPath(sessionId, currentNode.id, sessionData.round));
    const votesSnapshot = await get(votesRef);

    const counts = { A: 0, B: 0 };
    if (votesSnapshot.exists()) {
      const votes = votesSnapshot.val();
      for (const vote of Object.values(votes)) {
        if (vote === 'A') counts.A++;
        if (vote === 'B') counts.B++;
      }
    }
    console.log('closeVoting: Vote counts:', counts);

    // Determine winner
    const winner = counts.A >= counts.B ? 'A' : 'B';
    console.log('closeVoting: Winner is', winner);

    const sessionRef = ref(database, sessionPath(sessionId));
    const newData = {
      ...sessionData,
      status: 'closed',
      winner
    };
    console.log('closeVoting: Writing to Firebase:', newData);

    await set(sessionRef, newData);
    console.log('closeVoting: Successfully closed voting');
  } catch (error) {
    console.error('closeVoting: ERROR:', error);
    alert(`Failed to close voting: ${error.message}`);
  }
}

async function reopenVoting() {
  const sessionRef = ref(database, sessionPath(sessionId));
  await set(sessionRef, {
    ...sessionData,
    status: 'open',
    winner: null
  });
}

async function continueToNode(nodeId, winner, countA, countB) {
  const nextNode = story.nodes[nodeId];
  if (!nextNode) {
    alert(`Node ${nodeId} not found`);
    return;
  }

  const newPath = [...(sessionData.path || []), {
    node: currentNode.id,
    winner,
    countA,
    countB
  }];

  const sessionRef = ref(database, sessionPath(sessionId));
  await set(sessionRef, {
    ...sessionData,
    currentNode: nodeId,
    status: nextNode.question ? 'open' : 'story',
    winner: null,
    round: sessionData.round + 1,
    path: newPath
  });
}

async function goBack() {
  if (!sessionData.path || sessionData.path.length === 0) return;

  const newPath = [...sessionData.path];
  const lastStep = newPath.pop();

  const sessionRef = ref(database, sessionPath(sessionId));
  await set(sessionRef, {
    ...sessionData,
    currentNode: lastStep.node,
    status: 'closed',
    winner: lastStep.winner,
    round: sessionData.round + 1,
    path: newPath
  });
}

async function resetSession() {
  const sessionRef = ref(database, sessionPath(sessionId));
  await set(sessionRef, null);
}

// Render summary
async function renderSummary() {
  const summarySection = document.getElementById('summarySection');

  let html = `<h2 class="summary-title">${strings.summaryTitle}</h2>`;
  html += `<div class="path-summary">`;
  html += `<h3>${strings.yourPath}</h3>`;

  let closestSplit = null;
  let closestDiff = 100;

  if (sessionData.path && sessionData.path.length > 0) {
    for (const step of sessionData.path) {
      const node = story.nodes[step.node];
      if (!node || !node.question) continue;

      const total = step.countA + step.countB;
      const percentA = total > 0 ? Math.round((step.countA / total) * 100) : 50;
      const percentB = 100 - percentA;
      const diff = Math.abs(percentA - percentB);

      if (diff < closestDiff) {
        closestDiff = diff;
        closestSplit = { question: node.question, percentA, percentB, optionA: node.options.A.label, optionB: node.options.B.label };
      }

      html += `<div class="path-item">`;
      html += `<div class="path-question">${node.question}</div>`;
      html += `<div class="path-results">`;
      html += `<span>A: ${node.options.A.label} — ${percentA}%</span>`;
      html += `<span>B: ${node.options.B.label} — ${percentB}%</span>`;
      html += `</div>`;
      html += `</div>`;
    }
  }

  html += `</div>`;

  if (closestSplit) {
    html += `<div class="closest-call">`;
    html += `<div class="closest-call-title">${strings.closestCall}</div>`;
    html += `<p>${closestSplit.question}</p>`;
    html += `<p>${closestSplit.percentA}% vs ${closestSplit.percentB}%</p>`;
    html += `</div>`;
  }

  summarySection.innerHTML = html;
  summarySection.style.display = 'block';
}

// Start
init();
