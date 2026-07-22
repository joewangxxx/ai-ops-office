async (page) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4175/');
  await page.waitForSelector('[data-testid=office-scene]');
  await page.waitForTimeout(600);

  const staticMetrics = await page.evaluate(() => {
    const ids = ['pm-alice', 'pm-bob', 'dev-jack', 'dev-kara', 'dev-leo', 'qa-quinn', 'qa-rita'];
    const rect = (element) => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom, width: bounds.width, height: bounds.height };
    };
    const people = ids.map((id) => {
      const avatar = rect(document.querySelector(`[data-testid="avatar-${id}"]`));
      const tag = rect(document.querySelector(`[data-testid="name-tag-${id}"]`));
      const orb = rect(document.querySelector(`[data-testid="orb-${id}"]`));
      return {
        id,
        tagAboveAvatar: avatar.top - tag.bottom,
        tagBelowAvatar: tag.top - avatar.bottom,
        orbBoxGap: orb.left - avatar.right,
        avatar,
        tag,
        orb,
      };
    });
    const screen = document.querySelector('[data-testid="artifact-hub-screen"]');
    const rows = [...screen.querySelectorAll('.artifact-hub__metric')].map((row) => {
      const label = rect(row.querySelector('.artifact-hub__metric-label'));
      const count = rect(row.querySelector('.artifact-hub__metric-count'));
      return { label, count, gap: count.left - label.right };
    });
    return {
      people,
      hub: {
        clientWidth: screen.clientWidth,
        scrollWidth: screen.scrollWidth,
        clientHeight: screen.clientHeight,
        scrollHeight: screen.scrollHeight,
        rows,
      },
    };
  });

  await page.evaluate(async () => {
    await fetch('/api/office-reset', { method: 'POST' });
    await fetch('/api/office-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'artifact.completed',
        artifact: { id: 'task72-independent-prd', category: 'prd', title: 'Task 7.2 Independent PRD' },
        producerDeskId: 'pm-alice',
        assigneeDeskId: 'dev-jack',
      }),
    });
  });
  await page.waitForSelector('[data-testid="moving-avatar-alice"]', { timeout: 10000 });
  await page.waitForTimeout(150);
  const movingMetrics = await page.evaluate(() => {
    const rect = (selector) => {
      const bounds = document.querySelector(selector).getBoundingClientRect();
      return { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom };
    };
    const avatar = rect('[data-testid="moving-avatar-alice"]');
    const tag = rect('[data-testid="name-tag-pm-alice"]');
    const orb = rect('[data-testid="orb-pm-alice"]');
    return { avatar, tag, orb, tagGap: avatar.top - tag.bottom, orbGap: orb.left - avatar.right };
  });

  await page.screenshot({
    path: 'C:/Users/29929/Desktop/AI-Wrokspace/output/playwright/task7-2-independent-audit.png',
    fullPage: true,
  });

  return { staticMetrics, movingMetrics, consoleErrors, pageErrors };
}
