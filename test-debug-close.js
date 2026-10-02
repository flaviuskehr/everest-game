import { chromium } from 'playwright';

async function debugCloseVoting() {
  console.log('Debugging Close Voting...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });

  const hostPage = await context.newPage();

  // Capture all console output
  hostPage.on('console', msg => {
    console.log(`HOST [${msg.type()}]:`, msg.text());
  });

  await hostPage.goto('http://localhost:8000/host.html?s=test');
  await hostPage.waitForTimeout(3000);

  // Add logging to the page
  await hostPage.evaluate(() => {
    const originalSet = window.set;
    console.log('Added Firebase set interceptor');
  });

  console.log('Current state:');
  const nodeId = await hostPage.locator('#currentNodeId').textContent();
  const status = await hostPage.locator('#statusDisplay').textContent();
  console.log(`Node: ${nodeId}, Status: ${status}`);

  // Check if we're at d1 with voting open
  if (nodeId !== 'd1' || status !== 'open') {
    console.log('Not at d1 with open voting. Need to advance first.');

    // Click Next if at intro
    if (nodeId === 'intro') {
      const nextBtn = hostPage.locator('button:has-text("Next")');
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        console.log('Clicked Next');
        await hostPage.waitForTimeout(3000);
      }
    }
  }

  // Now try to close voting
  console.log('\nAttempting to close voting...');
  const closeBtn = hostPage.locator('button:has-text("Close Voting")');
  const isEnabled = await closeBtn.isEnabled();
  console.log(`Close Voting button enabled: ${isEnabled}`);

  if (isEnabled) {
    // Add a listener to track when the button is clicked
    await hostPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Close Voting'));
      if (btn) {
        btn.addEventListener('click', () => {
          console.log('CLOSE VOTING BUTTON CLICKED!');
        });
      }
    });

    await closeBtn.click();
    console.log('Clicked Close Voting button');

    // Wait and check
    await hostPage.waitForTimeout(4000);

    const newStatus = await hostPage.locator('#statusDisplay').textContent();
    console.log(`Status after close: ${newStatus}`);

    // Check Firebase directly
    const sessionState = await hostPage.evaluate(async () => {
      const { database, ref, get } = await import('./js/firebase.js');
      const sessionRef = ref(database, 'sessions/test');
      const snapshot = await get(sessionRef);
      return snapshot.val();
    });

    console.log('\nFirebase session state:');
    console.log(JSON.stringify(sessionState, null, 2));

    await hostPage.screenshot({ path: 'debug-close-voting.png', fullPage: true });
  }

  console.log('\nKeeping browser open. Press Ctrl+C to close.');
  await new Promise(() => {});
}

debugCloseVoting().catch(console.error);
