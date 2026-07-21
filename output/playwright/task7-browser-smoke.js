async (page) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await page.waitForSelector('[data-testid=office-scene]');

  await page.evaluate(() => {
    window.__task7Directions = [];
    window.__task7Observer = new MutationObserver(() => {
      document.querySelectorAll('[data-movement-direction]').forEach((element) => {
        const direction = element.getAttribute('data-movement-direction');
        if (direction && !window.__task7Directions.includes(direction)) window.__task7Directions.push(direction);
      });
    });
    window.__task7Observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  });

  const completion = await page.evaluate(async () => {
    const response = await fetch('/api/office-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'artifact.completed',
        artifact: { id: 'search-prd-v1', category: 'prd', title: 'Search PRD v1.0' },
        producerDeskId: 'pm-alice',
        assigneeDeskId: 'dev-jack',
      }),
    });
    return response.json();
  });

  await page.waitForSelector('[data-testid=moving-avatar-alice]', { timeout: 3000 });
  const aliceInitial = await page.locator('[data-testid=moving-avatar-alice]').evaluate((element) => ({
    direction: element.getAttribute('data-movement-direction'),
    src: element.querySelector('img')?.getAttribute('src'),
    transform: element.style.transform,
  }));

  await page.getByRole('button', { name: 'Open Jack detail' }).click();
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find((element) => element.getAttribute('aria-label') === 'Accept Search PRD v1.0');
    return button && !button.disabled;
  }, null, { timeout: 6000 });
  await page.getByRole('button', { name: 'Accept Search PRD v1.0' }).click();

  await page.waitForSelector('[data-testid=moving-avatar-jack]', { timeout: 3000 });
  const jackInitial = await page.locator('[data-testid=moving-avatar-jack]').evaluate((element) => ({
    direction: element.getAttribute('data-movement-direction'),
    src: element.querySelector('img')?.getAttribute('src'),
    transform: element.style.transform,
  }));

  await page.waitForFunction(() => document.querySelector('[data-testid=runtime-artifact-search-prd-v1]')?.getAttribute('data-artifact-location') === 'desk', null, { timeout: 8000 });
  const directions = await page.evaluate(() => {
    window.__task7Observer.disconnect();
    return window.__task7Directions.sort();
  });
  const landed = {
    avatarVisible: await page.locator('[data-testid=avatar-dev-jack]').isVisible(),
    artifactLocation: await page.locator('[data-testid=runtime-artifact-search-prd-v1]').getAttribute('data-artifact-location'),
    seatedPose: await page.locator('[data-testid=avatar-dev-jack]').getAttribute('data-avatar-pose'),
  };
  await page.screenshot({ path: 'C:/Users/29929/Desktop/AI-Wrokspace/output/playwright/task7-event-handoff.png', fullPage: true });

  return {
    completionRevision: completion.revision,
    aliceInitial,
    jackInitial,
    directions,
    landed,
    consoleErrors,
    pageErrors,
  };
}
