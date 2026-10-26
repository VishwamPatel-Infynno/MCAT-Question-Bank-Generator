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

        # -> Open the question generator using “Get Started - Create Questions.”
        # Get Started - Create Questions button
        elem = page.get_by_role("button", name="Get Started - Create Questions")
        await elem.click(timeout=10000)

        # -> Continue from the selected Chemistry & Physics section to the unit-selection step.
        # Continue to Unit button
        elem = page.get_by_role("button", name="Continue to Unit")
        await elem.click(timeout=10000)

        # -> Continue from the selected major unit to the topic-selection step.
        # Continue to Topic button
        elem = page.get_by_role("button", name="Continue to Topic")
        await elem.click(timeout=10000)

        # -> Continue from the selected topic and subtopic to the question-level settings.
        # Continue to Level button
        elem = page.get_by_role("button", name="Continue to Level")
        await elem.click(timeout=10000)

        # -> Select “Live Mini-Set (5 Qs)” to use the staged batch review workflow.
        # 🎯 Live Mini-Set (5 Qs) Staged Batch Desk... button
        elem = page.get_by_role("button", name="🎯 Live Mini-Set (5 Qs)")
        await elem.click(timeout=10000)

        # -> Continue from the selected Live Mini-Set setup to the trap-selection step.
        # Continue to Traps button
        elem = page.get_by_role("button", name="Continue to Traps")
        await elem.click(timeout=10000)

        # -> Continue from the cognitive-trap settings to the Visuals step.
        # Continue to Visuals button
        elem = page.get_by_role("button", name="Continue to Visuals")
        await elem.click(timeout=10000)

        # -> Open the configuration review by clicking “Review Configuration.”
        # Review Configuration button
        elem = page.get_by_role("button", name="Review Configuration")
        await elem.click(timeout=10000)

        # -> Click “Generate 5-Question Set (Live)” to start generation and check for the staged-question review.
        # Generate 5-Question Set (Live) button
        elem = page.get_by_role("button", name="Generate 5-Question Set (Live)")
        await elem.click(timeout=10000)

        # --> Assertions to verify final state

        # --> Five staged questions are displayed for review.
        await (
            page.get_by_text(
                "Question 5•mediumSingle Choice MCQPassage Set95/100References shared reading"
            )
            .nth(0)
            .scroll_into_view_if_needed()
        )
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The fifth staged question is visible for review.
        (
            await expect(
                page.get_by_text(
                    "Question 5•mediumSingle Choice MCQPassage Set95/100References shared reading"
                ).nth(0)
            ).to_be_visible(timeout=15000),
            "The fifth staged question is visible for review.",
        )

        # --> Generation is marked complete with five questions ready.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Generation is marked complete with five questions ready.
        (
            await expect(page.get_by_role("main").nth(0)).to_contain_text(
                "All Questions Ready (5 Questions Created)", timeout=15000
            ),
            "Generation is marked complete with five questions ready.",
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
