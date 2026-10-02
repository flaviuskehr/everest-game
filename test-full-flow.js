import { chromium } from 'playwright';

async function testFullGameFlow() {
  console.log('Starting full game flow test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });

  // Open host page
  const hostPage = await context.newPage();
  await hostPage.goto('http://localhost:8000/host.html?s=test');
  console.log('✓ Opened host page');

  // Check if already logged in
  await hostPage.waitForTimeout(2000);
  const loginVisible = await hostPage.locator('#loginContainer').isVisible();

  if (loginVisible) {
    console.log('Logging in as host...');
    await hostPage.fill('#email', 'flavius.kehr@sap.com');
    await hostPage.fill('#password', 'MeinPasswort');
    await hostPage.click('button[type="submit"]');
    await hostPage.waitForTimeout(2000);
  }

  console.log('✓ Host logged in\n');

  // Open participant page
  const participantPage = await context.newPage();
  await participantPage.goto('http://localhost:8000/index.html?s=test');
  console.log('✓ Opened participant page');
  await participantPage.waitForTimeout(2000);

  // Check initial state
  console.log('\n=== INITIAL STATE (Node: intro) ===');
  let hostNode = await hostPage.locator('#currentNodeId').textContent();
  let hostStatus = await hostPage.locator('#statusDisplay').textContent();
  let participantTitle = await participantPage.locator('#nodeTitle').textContent();
  let participantWaiting = await participantPage.locator('#waitingState').isVisible();

  console.log(`Host: Node=${hostNode}, Status=${hostStatus}`);
  console.log(`Participant: Title="${participantTitle}", Waiting=${participantWaiting}`);

  // Screenshot initial state
  await hostPage.screenshot({ path: 'test-1-intro-host.png' });
  await participantPage.screenshot({ path: 'test-1-intro-participant.png' });
  console.log('✓ Screenshots saved: test-1-intro-*.png');

  // HOST: Click Next to advance to d1 (first question)
  console.log('\n=== HOST CLICKS NEXT ===');
  const nextButton = hostPage.locator('button:has-text("Next")');
  const isEnabled = await nextButton.isEnabled();
  console.log(`Next button enabled: ${isEnabled}`);

  if (isEnabled) {
    await nextButton.click();
    console.log('✓ Clicked Next button');
    await hostPage.waitForTimeout(2000);
  } else {
    console.log('✗ Next button is disabled!');
    await browser.close();
    return;
  }

  // Check state after Next
  console.log('\n=== AFTER NEXT (Should be Node: d1) ===');
  hostNode = await hostPage.locator('#currentNodeId').textContent();
  hostStatus = await hostPage.locator('#statusDisplay').textContent();
  participantTitle = await participantPage.locator('#nodeTitle').textContent();
  participantWaiting = await participantPage.locator('#waitingState').isVisible();
  const participantQuestion = await participantPage.locator('#questionText').isVisible();

  console.log(`Host: Node=${hostNode}, Status=${hostStatus}`);
  console.log(`Participant: Title="${participantTitle}", Waiting=${participantWaiting}, Question visible=${participantQuestion}`);

  if (participantQuestion) {
    const questionText = await participantPage.locator('#questionText').textContent();
    console.log(`Question: "${questionText}"`);
  }

  // Screenshot d1 state
  await hostPage.screenshot({ path: 'test-2-d1-host.png' });
  await participantPage.screenshot({ path: 'test-2-d1-participant.png' });
  console.log('✓ Screenshots saved: test-2-d1-*.png');

  // PARTICIPANT: Vote
  if (participantQuestion) {
    console.log('\n=== PARTICIPANT VOTES ===');
    const voteButtons = participantPage.locator('.vote-button');
    const buttonCount = await voteButtons.count();
    console.log(`Vote buttons available: ${buttonCount}`);

    if (buttonCount > 0) {
      await voteButtons.first().click();
      console.log('✓ Voted on option A');
      await participantPage.waitForTimeout(1000);

      await participantPage.screenshot({ path: 'test-3-voted-participant.png' });
      console.log('✓ Screenshot saved: test-3-voted-participant.png');
    }
  }

  // HOST: Check live votes
  console.log('\n=== HOST CHECKS LIVE VOTES ===');
  await hostPage.waitForTimeout(1000);
  const liveVoteCount = await hostPage.locator('#liveVoteCount').textContent();
  console.log(`Live votes: ${liveVoteCount}`);
  await hostPage.screenshot({ path: 'test-4-livevotes-host.png' });

  // HOST: Close voting
  console.log('\n=== HOST CLOSES VOTING ===');
  const closeButton = hostPage.locator('button:has-text("Close Voting")');
  const closeEnabled = await closeButton.isEnabled();
  console.log(`Close Voting button enabled: ${closeEnabled}`);

  if (closeEnabled) {
    await closeButton.click();
    console.log('✓ Clicked Close Voting');
    await hostPage.waitForTimeout(2000);
  }

  // Check state after closing
  console.log('\n=== AFTER CLOSING VOTE ===');
  hostStatus = await hostPage.locator('#statusDisplay').textContent();
  console.log(`Host status: ${hostStatus}`);

  const participantResults = await participantPage.locator('#resultsSection').isVisible();
  console.log(`Participant results visible: ${participantResults}`);

  await hostPage.screenshot({ path: 'test-5-closed-host.png' });
  await participantPage.screenshot({ path: 'test-5-closed-participant.png' });
  console.log('✓ Screenshots saved: test-5-closed-*.png');

  // HOST: Continue to next node
  console.log('\n=== HOST CONTINUES ===');
  await hostPage.waitForTimeout(1000);
  const continueButton = hostPage.locator('button.continue-btn').first();
  const continueExists = await continueButton.count() > 0;
  console.log(`Continue button exists: ${continueExists}`);

  if (continueExists) {
    const buttonText = await continueButton.textContent();
    console.log(`Continue button: "${buttonText}"`);
    await continueButton.click();
    console.log('✓ Clicked Continue');
    await hostPage.waitForTimeout(2000);

    hostNode = await hostPage.locator('#currentNodeId').textContent();
    participantTitle = await participantPage.locator('#nodeTitle').textContent();
    console.log(`Now at - Host: ${hostNode}, Participant: "${participantTitle}"`);
  }

  await hostPage.screenshot({ path: 'test-6-continued-host.png' });
  await participantPage.screenshot({ path: 'test-6-continued-participant.png' });
  console.log('✓ Screenshots saved: test-6-continued-*.png');

  console.log('\n=== TEST COMPLETE ===');
  console.log('Review the screenshots to see the full flow.');
  console.log('Keeping browser open. Press Ctrl+C to close.');

  // Keep browser open
  await new Promise(() => {});
}

testFullGameFlow().catch(console.error);
