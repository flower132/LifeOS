const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto('http://localhost:3000/create-object', { waitUntil: 'networkidle' });
  console.log('Page loaded');

  const submitBtn = page.locator('button[type="submit"]');
  const initialDisabled = await submitBtn.isDisabled();
  console.log('Initial button disabled:', initialDisabled);

  // Type in the Name field (the first text input in the form)
  const nameInput = page.locator('form input[type="text"]').first();
  await nameInput.fill('Test Object');
  console.log('Typed "Test Object" into Name field');

  await page.waitForTimeout(500);

  const afterDisabled = await submitBtn.isDisabled();
  console.log('Button disabled after typing:', afterDisabled);

  const btnAttr = await submitBtn.getAttribute('disabled');
  const btnClass = await submitBtn.getAttribute('class');
  console.log('Button disabled attr:', btnAttr);
  console.log('Button class:', btnClass);

  if (!afterDisabled) {
    await submitBtn.click();
    await page.waitForTimeout(1000);
    console.log('Clicked submit. Current URL:', page.url());
  } else {
    console.log('Button is still disabled after typing!');
  }

  if (errors.length) console.log('Console errors:', errors);
  if (pageErrors.length) console.log('Page errors:', pageErrors);

  await browser.close();
})();
