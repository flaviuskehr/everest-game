import { chromium } from 'playwright';

async function debugNextButton() {
  console.log('Debugging Next button click...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });

  const hostPage = await context.newPage();

  // Capture console logs
  hostPage.on('console', msg => {
    console.log(`BROWSER LOG [${msg.type()}]:`, msg.text());
  });

  // Capture errors
  hostPage.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  await hostPage.goto('http://localhost:8000/host.html?s=test');
  await hostPage.waitForTimeout(3000);

  console.log('Current URL:', hostPage.url());

  // Check button state
  const nextButton = hostPage.locator('button:has-text("Next")');
  const exists = await nextButton.count();
  const isEnabled = exists > 0 ? await nextButton.isEnabled() : false;
  const isVisible = exists > 0 ? await nextButton.isVisible() : false;

  console.log(`Next button - Exists: ${exists}, Enabled: ${isEnabled}, Visible: ${isVisible}`);

  if (exists > 0 && isEnabled) {
    console.log('\nClicking Next button...');

    // Add a click handler in the page to see if it fires
    await hostPage.evaluate(() => {
      console.log('BEFORE CLICK: Adding debug listener');
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.textContent.includes('Next')) {
          console.log('Found Next button in DOM');
          btn.addEventListener('click', () => {
            console.log('NEXT BUTTON CLICKED!');
          });
        }
      });
    });

    await nextButton.click();
    console.log('Click command sent');

    await hostPage.waitForTimeout(3000);

    // Check if state changed
    const nodeId = await hostPage.locator('#currentNodeId').textContent();
    console.log(`Node after click: ${nodeId}`);
  }

  // Check Firebase session state directly
  const sessionState = await hostPage.evaluate(async () => {
    const { database, ref, get } = await import('./js/firebase.js');
    const sessionRef = ref(database, 'sessions/test');
    const snapshot = await get(sessionRef);
    return snapshot.val();
  });

  console.log('\nFirebase session state:', JSON.stringify(sessionState, null, 2));

  await hostPage.screenshot({ path: 'debug-next-button.png', fullPage: true });
  console.log('\nScreenshot saved: debug-next-button.png');
  console.log('Keeping browser open. Press Ctrl+C to close.');

  await new Promise(() => {});
}

debugNextButton().catch(console.error);
