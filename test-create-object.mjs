import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  await page.goto('http://localhost:3000/create-object', { waitUntil: 'networkidle' });
  console.log('Page loaded');

  // Check initial button state
  const submitBtn = page.locator('button[type="submit"]');
  const initialDisabled = await submitBtn.isDisabled();
  console.log('Initial button disabled:', initialDisabled);

  // Type in the Name field
  const nameInput = page.locator('input[type="text"]');
  await nameInput.fill('Test Object');
  console.log('Typed "Test Object" into Name field');

  // Wait a moment for React to update
  await page.waitForTimeout(500);

  // Check button state after typing
  const afterDisabled = await submitBtn.isDisabled();
  console.log('Button disabled after typing:', afterDisabled);

  // Get the button's class and disabled attribute
  const btnAttr = await submitBtn.getAttribute('disabled');
  const btnClass = await submitBtn.getAttribute('class');
  console.log('Button disabled attr:', btnAttr);
  console.log('Button class:', btnClass);

  // Try clicking the button
  if (!afterDisabled) {
    await submitBtn.click();
    await page.waitForTimeout(1000);
    console.log('Clicked submit. Current URL:', page.url());
  }

  // Report errors
  if (errors.length > 0) {
    console.log('Console errors:', errors);
  }
  if (pageErrors.length > 0) {
    console.log('Page errors:', pageErrors);
  }

  await browser.close();
})();
