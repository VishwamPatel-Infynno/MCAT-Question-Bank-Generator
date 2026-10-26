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

        # -> Select “Biology & Biochem” as the exam section.
        # Biology & Biochem Biological and Biochemical... button
        elem = page.get_by_role("button", name="Biology & Biochem Biological")
        await elem.click(timeout=10000)

        # -> Continue from the selected Biology discipline and unit to choose a topic.
        # Continue to Topic button
        elem = page.get_by_role("button", name="Continue to Topic")
        await elem.click(timeout=10000)

        # -> Continue from the selected topic and concept to review the available question level options.
        # Continue to Level button
        elem = page.get_by_role("button", name="Continue to Level")
        await elem.click(timeout=10000)

        # -> Select “Quick Single Item (1 Q)” to use the live Question Desk generation workflow.
        # ⚡ Quick Single Item (1 Q) Live Workspace... button
        elem = page.get_by_role("button", name="⚡ Quick Single Item (1 Q)")
        await elem.click(timeout=10000)

        # -> Continue to the traps configuration step using “Continue to Traps.”
        # Continue to Traps button
        elem = page.get_by_role("button", name="Continue to Traps")
        await elem.click(timeout=10000)

        # -> Continue to the visuals setup using “Continue to Visuals.”
        # Continue to Visuals button
        elem = page.get_by_role("button", name="Continue to Visuals")
        await elem.click(timeout=10000)

        # -> Open the configuration review using “Review Configuration.”
        # Review Configuration button
        elem = page.get_by_role("button", name="Review Configuration")
        await elem.click(timeout=10000)

        # -> Start live generation by selecting “Generate Single Question (Live)” and observe the generation state.
        # Generate Single Question (Live) button
        elem = page.get_by_role("button", name="Generate Single Question (")
        await elem.click(timeout=10000)

        # -> Open the Question Generator view and verify whether generation has stopped and the workspace is idle.
        # Question Generator button
        elem = page.get_by_role("button", name="Question Generator")
        await elem.click(timeout=10000)

        # --> Assertions to verify final state

        # --> The generation ended and the workspace is ready for review.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The workspace is ready for review after generation stops.
        (
            await expect(page.get_by_role("main").nth(0)).to_contain_text(
                "Ready for Review", timeout=15000
            ),
            "The workspace is ready for review after generation stops.",
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
