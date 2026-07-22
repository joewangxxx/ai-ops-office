async (page) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4175/');
  await page.waitForSelector('[data-testid=office-scene]');
  await page.getByRole('button', { name: 'Open Jack detail' }).click();
  await page.evaluate(() => {
    window.__task71Unhandled = [];
    window.addEventListener('unhandledrejection', (event) => {
      window.__task71Unhandled.push(String(event.reason));
    });
  });

  await page.evaluate(async () => {
    await fetch('/api/office-reset', { method: 'POST' });
    await fetch('/api/office-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'artifact.completed',
        artifact: { id: 'task71-review-prd', category: 'prd', title: 'Task 7.1 Review PRD' },
        producerDeskId: 'pm-alice',
        assigneeDeskId: 'dev-jack',
      }),
    });
  });

  await page.waitForFunction(() => document.querySelector('[data-testid=moving-avatar-alice] img')?.getAttribute('src')?.includes('/walk-'));
  const accept = page.getByRole('button', { name: 'Accept Task 7.1 Review PRD' });
  await accept.waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find((element) => element.getAttribute('aria-label') === 'Accept Task 7.1 Review PRD');
    return button && !button.disabled;
  });
  const phaseAtAccept = await page.evaluate(async () => {
    const state = await fetch('/api/office-state').then((response) => response.json());
    return state.activeMotion?.phase;
  });
  await accept.click();

  const queuedAtAccept = await page.evaluate(async () => {
    const state = await fetch('/api/office-state').then((response) => response.json());
    return {
      activePhase: state.activeMotion?.phase,
      queuedPhases: state.motionQueue.map((motion) => motion.phase),
    };
  });

  await page.getByRole('button', { name: 'Working on Task 7.1 Review PRD' }).waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(600);

  const finalState = await page.evaluate(async () => {
    const state = await fetch('/api/office-state').then((response) => response.json());
    return {
      activeMotion: state.activeMotion,
      artifactLocation: state.artifacts['task71-review-prd']?.location,
      activeWorkCount: state.scenario.people.find((person) => person.deskId === 'dev-jack')?.activeWorks.length,
      handoffCount: state.scenario.handoffs.length,
      unhandledRejections: window.__task71Unhandled,
    };
  });
  const artifactVisibleAtDesk = await page.locator('[data-testid=runtime-artifact-task71-review-prd]').count();
  await page.screenshot({
    path: 'C:/Users/29929/Desktop/AI-Wrokspace/output/playwright/task7-1-independent-review.png',
    fullPage: true,
  });

  return {
    phaseAtAccept,
    queuedAtAccept,
    finalState,
    artifactVisibleAtDesk,
    consoleErrors,
    pageErrors,
  };
}
