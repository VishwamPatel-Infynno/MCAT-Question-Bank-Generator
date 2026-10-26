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

        # -> Open the question generator using “Get Started - Create Questions” and inspect its initial settings.
        # Get Started - Create Questions button
        elem = page.get_by_role("button", name="Get Started - Create Questions")
        await elem.click(timeout=10000)

        # -> Continue from the default exam section and inspect the next wizard step.
        # Continue to Unit button
        elem = page.get_by_role("button", name="Continue to Unit")
        await elem.click(timeout=10000)

        # -> Continue with the default discipline and unit selections to inspect the topic step.
        # Continue to Topic button
        elem = page.get_by_role("button", name="Continue to Topic")
        await elem.click(timeout=10000)

        # -> Continue from the default topic and concept to inspect the difficulty-level step.
        # Continue to Level button
        elem = page.get_by_role("button", name="Continue to Level")
        await elem.click(timeout=10000)

        # -> Continue from the default level and format settings to inspect the Traps step.
        # Continue to Traps button
        elem = page.get_by_role("button", name="Continue to Traps")
        await elem.click(timeout=10000)

        # -> Continue from the default Cognitive Traps & Reasoning Skills settings to the Visuals step.
        # Continue to Visuals button
        elem = page.get_by_role("button", name="Continue to Visuals")
        await elem.click(timeout=10000)

        # -> Open the Review Configuration step while leaving optional visual and refinement settings unchanged.
        # Review Configuration button
        elem = page.get_by_role("button", name="Review Configuration")
        await elem.click(timeout=10000)

        # -> Launch the 50-question batch using the unchanged default settings and verify that the live generation pipeline appears.
        # Launch 50-Question Batch button
        elem = page.get_by_role("button", name="Launch 50-Question Batch")
        await elem.click(timeout=10000)

        # --> Assertions to verify final state

        # --> The Batch Activity view displays an in-progress generation batch.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The generation batch is shown as in progress.
        (
            await expect(page.get_by_role("main").nth(0)).to_contain_text(
                "In Progress", timeout=15000
            ),
            "The generation batch is shown as in progress.",
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
