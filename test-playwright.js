import { chromium } from 'playwright';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });

  // Open participant page
  const participantPage = await context.newPage();
  await participantPage.goto('http://localhost:8000/index.html?s=test');
  await participantPage.waitForTimeout(3000); // Wait for Firebase to load

  console.log('Participant Page:');
  console.log('URL:', participantPage.url());
  console.log('Title:', await participantPage.title());

  // Check what's visible
  const waitingVisible = await participantPage.locator('#waitingState').isVisible();
  const storyTextVisible = await participantPage.locator('#storyText').isVisible();
  const questionVisible = await participantPage.locator('#questionSection').isVisible();

  console.log('Waiting state visible:', waitingVisible);
  console.log('Story text visible:', storyTextVisible);
  console.log('Question section visible:', questionVisible);

  if (storyTextVisible) {
    const storyText = await participantPage.locator('#storyText').textContent();
    console.log('Story text:', storyText.substring(0, 100) + '...');
  }

  const heroTitle = await participantPage.locator('#nodeTitle').textContent();
  console.log('Hero title:', heroTitle);

  // Check for errors in console
  participantPage.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Participant Console Error:', msg.text());
    }
  });

  await participantPage.screenshot({ path: 'participant-screenshot.png', fullPage: true });
  console.log('Screenshot saved: participant-screenshot.png');

  // Open host page
  const hostPage = await context.newPage();
  await hostPage.goto('http://localhost:8000/host.html?s=test');
  await hostPage.waitForTimeout(3000);

  console.log('\nHost Page:');
  console.log('URL:', hostPage.url());

  const loginVisible = await hostPage.locator('#loginContainer').isVisible();
  const hostViewVisible = await hostPage.locator('#hostView').isVisible();

  console.log('Login form visible:', loginVisible);
  console.log('Host view visible:', hostViewVisible);

  if (hostViewVisible) {
    const currentNodeId = await hostPage.locator('#currentNodeId').textContent();
    const statusDisplay = await hostPage.locator('#statusDisplay').textContent();
    console.log('Current node:', currentNodeId);
    console.log('Status:', statusDisplay);

    const heroTitle = await hostPage.locator('#nodeTitle').textContent();
    console.log('Hero title:', heroTitle);

    const storyTextVisible = await hostPage.locator('#storyText').isVisible();
    console.log('Story text visible:', storyTextVisible);

    if (storyTextVisible) {
      const storyText = await hostPage.locator('#storyText').textContent();
      console.log('Story text:', storyText.substring(0, 100) + '...');
    }
  }

  hostPage.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Host Console Error:', msg.text());
    }
  });

  await hostPage.screenshot({ path: 'host-screenshot.png', fullPage: true });
  console.log('Screenshot saved: host-screenshot.png');

  console.log('\nKeeping browser open for inspection. Press Ctrl+C to close.');

  // Keep browser open for inspection
  await new Promise(() => {});
}

captureScreenshots().catch(console.error);
