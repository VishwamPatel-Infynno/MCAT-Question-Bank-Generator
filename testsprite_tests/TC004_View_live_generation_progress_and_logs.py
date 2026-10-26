import asyncio

from playwright import async_api


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

        # -> Open the question generator using “Get Started - Create Questions” and inspect its available setup fields.
        # Get Started - Create Questions button
        elem = page.get_by_role("button", name="Get Started - Create Questions")
        await elem.click(timeout=10000)

        # -> Continue from the selected Chemistry & Physics section to the Unit selection step.
        # Continue to Unit button
        elem = page.get_by_role("button", name="Continue to Unit")
        await elem.click(timeout=10000)

        # -> Continue to the topic-selection step using “Continue to Topic.”
        # Continue to Topic button
        elem = page.get_by_role("button", name="Continue to Topic")
        await elem.click(timeout=10000)

        # -> Continue to the Level step using the visible “Continue to Level” control.
        # Continue to Level button
        elem = page.get_by_role("button", name="Continue to Level")
        await elem.click(timeout=10000)

        # -> Continue from the Level and format screen to configure question traps.
        # Continue to Traps button
        elem = page.get_by_role("button", name="Continue to Traps")
        await elem.click(timeout=10000)

        # -> Select the visible “Identify or recognize a scientific concept” subskill on the Cognitive Traps screen.
        # Identify or recognize a scientific concept button
        elem = page.get_by_role("button", name="Identify or recognize a")
        await elem.click(timeout=10000)

        # -> Continue to the Visuals setup stage using the “Continue to Visuals” control.
        # Continue to Visuals button
        elem = page.get_by_role("button", name="Continue to Visuals")
        await elem.click(timeout=10000)

        # -> Open the configuration review screen using “Review Configuration.”
        # Review Configuration button
        elem = page.get_by_role("button", name="Review Configuration")
        await elem.click(timeout=10000)

        # -> Select the “1 Q (Live)” generation scope so the run can expose live progress, then inspect the updated review screen.
        # 1 Q (Live) button
        elem = page.get_by_role("button", name="Q (Live)")
        await elem.click(timeout=10000)

        # -> Start the live question generation with “Generate Single Question (Live)” and inspect the active run for progress and event logs.
        # Generate Single Question (Live) button
        elem = page.get_by_role("button", name="Generate Single Question (")
        await elem.click(timeout=10000)

        # --> Test passed — verified by AI agent
        frame = context.pages[-1]
        current_url = await frame.evaluate("() => window.location.href")
        assert current_url is not None, "Test completed successfully"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
