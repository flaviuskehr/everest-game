// Participant view application
import { parseStory, renderMarkdown } from './story-parser.js';
import {
  auth,
  database,
  signInAnonymously,
  onAuthStateChanged,
  ref,
  set,
  get,
  onValue,
  onDisconnect,
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

// Initialize
async function init() {
  sessionId = getSessionId();

  // Load story
  try {
    const storyMd = await loadStory(getStoryFile());
    story = parseStory(storyMd);

    if (story.errors.length > 0) {
      showError(`Story has ${story.errors.length} errors. Check check.html for details.`);
      return;
    }
  } catch (error) {
    showError(`Failed to load story: ${error.message}`);
    return;
  }

  // Sign in anonymously
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await setupPresence();
      listenToSession();
    } else {
      signInAnonymously(auth).catch(error => {
        showError(`Authentication failed: ${error.message}`);
      });
    }
  });
}

// Set up presence tracking
async function setupPresence() {
  const presenceRef = ref(database, presencePath(sessionId, currentUser.uid));
  await set(presenceRef, true);
  onDisconnect(presenceRef).remove();

  // Count participants
  const allPresenceRef = ref(database, `presence/${sessionId}`);
  onValue(allPresenceRef, (snapshot) => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    document.getElementById('participantCount').textContent = count;
  });
}

// Listen to session state
function listenToSession() {
  const sessionRef = ref(database, sessionPath(sessionId));

  onValue(sessionRef, (snapshot) => {
    if (!snapshot.exists()) {
      showWaiting();
      return;
    }

    sessionData = snapshot.val();
    const { currentNode: nodeId, status, winner, round } = sessionData;

    if (!nodeId) {
      showWaiting();
      return;
    }

    currentNode = story.nodes[nodeId];
    if (!currentNode) {
      showError(`Node ${nodeId} not found in story`);
      return;
    }

    renderNode(status, winner, round);
  });
}

// Render current node
async function renderNode(status, winner, round) {
  hideAll();

  // Hero section
  updateHero();

  // Story text
  const storyTextEl = document.getElementById('storyText');
  storyTextEl.innerHTML = renderMarkdown(currentNode.text);
  storyTextEl.style.display = 'block';

  // Check if this is an end node
  if (currentNode.end) {
    await renderSummary();
    return;
  }

  // Question node
  if (currentNode.question) {
    if (status === 'open') {
      await renderVoting(round);
    } else if (status === 'closed') {
      await renderResults(winner, round);
    } else {
      // Voting not yet opened - show waiting
      showWaiting();
    }
  }
  // Story-only nodes: just show the content (no waiting needed)
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

    // Handle image load error
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

// Render voting UI
async function renderVoting(round) {
  const questionSection = document.getElementById('questionSection');
  const questionText = document.getElementById('questionText');
  const voteButtons = document.getElementById('voteButtons');
  const voteStatus = document.getElementById('voteStatus');

  questionText.textContent = currentNode.question;
  voteButtons.innerHTML = '';

  // Check if user already voted
  const userVoteRef = ref(database, `${votesPath(sessionId, currentNode.id, round)}/${currentUser.uid}`);
  const voteSnapshot = await get(userVoteRef);
  const currentVote = voteSnapshot.val();

  // Create vote buttons
  for (const [option, data] of Object.entries(currentNode.options)) {
    const button = document.createElement('button');
    button.className = 'vote-button';
    button.setAttribute('data-option', option);
    button.textContent = data.label;

    if (currentVote === option) {
      button.classList.add('selected');
    }

    button.addEventListener('click', async () => {
      await vote(option, round);
    });

    voteButtons.appendChild(button);
  }

  if (currentVote) {
    voteStatus.textContent = strings.changeVote;
  } else {
    voteStatus.textContent = '';
  }

  questionSection.style.display = 'block';
}

// Submit vote
async function vote(option, round) {
  const userVoteRef = ref(database, `${votesPath(sessionId, currentNode.id, round)}/${currentUser.uid}`);

  try {
    await set(userVoteRef, option);

    // Update UI
    document.querySelectorAll('.vote-button').forEach(btn => {
      btn.classList.remove('selected');
      if (btn.getAttribute('data-option') === option) {
        btn.classList.add('selected');
      }
    });

    document.getElementById('voteStatus').textContent = strings.voteRecorded;
  } catch (error) {
    console.error('Vote failed:', error);
    alert('Failed to record vote. Please try again.');
  }
}

// Render results
async function renderResults(winner, round) {
  const resultsSection = document.getElementById('resultsSection');
  const questionSection = document.getElementById('questionSection');

  // Show question text but disable buttons
  const questionText = document.getElementById('questionText');
  const voteButtons = document.getElementById('voteButtons');
  questionText.textContent = currentNode.question;
  voteButtons.innerHTML = '';
  questionSection.style.display = 'block';

  // Get vote counts
  const votesRef = ref(database, votesPath(sessionId, currentNode.id, round));
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

  // Render results
  resultsSection.innerHTML = '';

  for (const [option, data] of Object.entries(currentNode.options)) {
    const count = counts[option];
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const isWinner = option === winner;

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

  // Announce result for screen readers
  const announcement = document.createElement('div');
  announcement.className = 'sr-only';
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `${strings.votingClosed}. Winner: ${currentNode.options[winner].label}`;
  document.body.appendChild(announcement);
}

// Render summary screen
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

// Show waiting state
function showWaiting() {
  hideAll();
  document.getElementById('waitingState').style.display = 'block';
}

// Show error
function showError(message) {
  hideAll();
  const container = document.querySelector('.container');
  container.innerHTML = `<div class="error-message">${message}<br><small>${strings.checkConsole}</small></div>`;
}

// Hide all sections
function hideAll() {
  document.getElementById('questionSection').style.display = 'none';
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('waitingState').style.display = 'none';
  document.getElementById('summarySection').style.display = 'none';
}

// Start
init();
