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

        # -> Open the question creation workflow using “Get Started - Create Questions.”
        # Get Started - Create Questions button
        elem = page.get_by_role("button", name="Get Started - Create Questions")
        await elem.click(timeout=10000)

        # -> Continue from the selected Chemistry & Physics section to the unit selection step.
        # Continue to Unit button
        elem = page.get_by_role("button", name="Continue to Unit")
        await elem.click(timeout=10000)

        # -> Continue from the selected unit to the topic-selection step.
        # Continue to Topic button
        elem = page.get_by_role("button", name="Continue to Topic")
        await elem.click(timeout=10000)

        # -> Continue from the selected topic and concept to the level-selection step.
        # Continue to Level button
        elem = page.get_by_role("button", name="Continue to Level")
        await elem.click(timeout=10000)

        # -> Continue from the selected level and format to configure the question traps.
        # Continue to Traps button
        elem = page.get_by_role("button", name="Continue to Traps")
        await elem.click(timeout=10000)

        # -> Launch the configured 50-question batch using “Launch 50-Question Batch.”
        # Launch 50-Question Batch button
        elem = page.get_by_role("button", name="Launch 50-Question Batch")
        await elem.click(timeout=10000)

        # -> Open the completed “Protons, neutrons, and electrons” batch to inspect its generated questions.
        # Open the completed “Protons, neutrons, and electrons” batch to inspect its generated questions.
        elem = page.locator("div:nth-child(3) > div > div:nth-child(3) > div")
        await elem.click(timeout=10000)

        # -> Open a constituent job’s “View 5 Generated Questions” view and verify that generated question text is visible.
        # View 5 Generated Questions button
        elem = page.locator("div:nth-child(4) > .btn-secondary").first
        await elem.click(timeout=10000)

        # --> Assertions to verify final state

        # --> The generated batch’s completed summary is displayed.
        await (
            page.get_by_text(
                "/ 10 Jobs Completed98 / 50 Questions (100%)Tokens: 286,000•Cost: $0.0503"
            )
            .nth(0)
            .scroll_into_view_if_needed()
        )
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The completed batch summary is visible.
        (
            await expect(
                page.get_by_text(
                    "/ 10 Jobs Completed98 / 50 Questions (100%)Tokens: 286,000•Cost: $0.0503"
                ).nth(0)
            ).to_be_visible(timeout=15000),
            "The completed batch summary is visible.",
        )

        # --> Generated questions are displayed for review.
        await (
            page.get_by_role("button", name="Hide 5 Generated Questions")
            .nth(0)
            .scroll_into_view_if_needed()
        )
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The generated-questions view is open.
        (
            await expect(
                page.get_by_role("button", name="Hide 5 Generated Questions").nth(0)
            ).to_be_visible(timeout=15000),
            "The generated-questions view is open.",
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
