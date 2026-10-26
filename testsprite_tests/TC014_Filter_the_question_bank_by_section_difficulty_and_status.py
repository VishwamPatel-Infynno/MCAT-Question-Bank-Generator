import asyncio

from playwright import async_api
from playwright.async_api import expect


async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process",
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:5173/")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass

        # -> Open the Question Bank view using the visible navigation tab.
        # Question Bank button
        elem = page.get_by_role("button", name="Question Bank", exact=True)
        await elem.click(timeout=10000)

        # -> Select the “Bio / Biochem” section filter and verify the question list updates.
        # Bio / Biochem button
        elem = page.get_by_role("button", name="Bio / Biochem")
        await elem.click(timeout=10000)

        # -> Apply the “Medium” difficulty filter and verify the displayed questions reflect that selection.
        # Medium button
        elem = page.get_by_role("button", name="Medium")
        await elem.click(timeout=10000)

        # -> Apply the “AI Validated” status filter and verify the displayed questions match the selected filters.
        # AI Validated button
        elem = page.get_by_role("button", name="AI Validated", exact=True)
        await elem.click(timeout=10000)

        # --> Assertions to verify final state

        # --> The filtered question list shows Bio / Biochem questions at Medium difficulty.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Verify the filtered list shows Bio / Biochem questions.
        (
            await expect(page.locator("#root").nth(0)).to_contain_text(
                "Biological and Biochemical Foundations", timeout=15000
            ),
            "Verify the filtered list shows Bio / Biochem questions.",
        )
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Verify the filtered list shows Medium-difficulty questions.
        (
            await expect(page.locator("#root").nth(0)).to_contain_text("medium", timeout=15000),
            "Verify the filtered list shows Medium-difficulty questions.",
        )
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
