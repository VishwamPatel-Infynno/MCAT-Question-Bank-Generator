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

        # -> Open the question-generation form using “Get Started - Create Questions.”
        # Get Started - Create Questions button
        elem = page.get_by_role("button", name="Get Started - Create Questions")
        await elem.click(timeout=10000)

        # -> Continue from the selected exam section to the unit-selection step.
        # Continue to Unit button
        elem = page.get_by_role("button", name="Continue to Unit")
        await elem.click(timeout=10000)

        # -> Continue from the selected Chemistry unit to choose a topic.
        # Continue to Topic button
        elem = page.get_by_role("button", name="Continue to Topic")
        await elem.click(timeout=10000)

        # -> Select the “Atomic number and mass number” topic concept and verify the selection updates.
        # Atomic number and mass number button
        elem = page.get_by_role("button", name="Atomic number and mass number")
        await elem.click(timeout=10000)

        # -> Continue from the selected topic to the question-level settings.
        # Continue to Level button
        elem = page.get_by_role("button", name="Continue to Level")
        await elem.click(timeout=10000)

        # -> Continue from the challenge-level and question-format settings to the traps configuration.
        # Continue to Traps button
        elem = page.get_by_role("button", name="Continue to Traps")
        await elem.click(timeout=10000)

        # -> Continue from the cognitive traps settings to the visuals step.
        # Continue to Visuals button
        elem = page.get_by_role("button", name="Continue to Visuals")
        await elem.click(timeout=10000)

        # -> Review the current question-generation configuration using “Review Configuration.”
        # Review Configuration button
        elem = page.get_by_role("button", name="Review Configuration")
        await elem.click(timeout=10000)

        # -> Switch the question-generation scope to “1 Q (Live)” and verify the review summary updates.
        # 1 Q (Live) button
        elem = page.get_by_role("button", name="Q (Live)")
        await elem.click(timeout=10000)

        # -> Generate one live question and inspect the generated-question view.
        # Generate Single Question (Live) button
        elem = page.get_by_role("button", name="Generate Single Question (")
        await elem.click(timeout=10000)

        # -> Open “AI Creation Steps” and verify that the audit trail’s reasoning details are displayed.
        # AI Creation Steps button
        elem = page.get_by_role("button", name="AI Creation Steps")
        await elem.click(timeout=10000)

        # -> Open the “Stage Outcome JSON Inspector” to check whether the generated question’s audit reasoning is displayed.
        # Stage Outcome JSON Inspector (Inspect live... button
        elem = page.get_by_role("button", name="Stage Outcome JSON Inspector")
        await elem.click(timeout=10000)

        # -> Select the “Quality Audit” stage in the expanded inspector and verify that audit reasoning is displayed.
        # Quality Audit button
        elem = page.get_by_role("button", name="Quality Audit")
        await elem.click(timeout=10000)

        # --> Assertions to verify final state

        # --> The Quality Audit reasoning is visible in the stage inspector.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The Quality Audit reasoning is visible in the inspector.
        (
            await expect(page.get_by_role("main").nth(0)).to_contain_text(
                "strengths", timeout=15000
            ),
            "The Quality Audit reasoning is visible in the inspector.",
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
