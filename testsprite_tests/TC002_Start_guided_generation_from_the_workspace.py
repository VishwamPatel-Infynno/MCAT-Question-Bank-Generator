import asyncio
import re
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
                "--single-process"
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
        
        # -> Continue from the selected major syllabus unit to the topic-selection step.
        # Continue to Topic button
        elem = page.get_by_role("button", name="Continue to Topic")
        await elem.click(timeout=10000)
        
        # -> Continue from the selected topic and concept to the level settings.
        # Continue to Level button
        elem = page.get_by_role("button", name="Continue to Level")
        await elem.click(timeout=10000)
        
        # -> Select “Live Mini-Set (5 Qs)” so the run uses the staged batch desk.
        # 🎯 Live Mini-Set (5 Qs) Staged Batch Desk... button
        elem = page.get_by_role("button", name="🎯 Live Mini-Set (5 Qs)")
        await elem.click(timeout=10000)
        
        # -> Continue from Level/Format to the Traps configuration screen.
        # Continue to Traps button
        elem = page.get_by_role("button", name="Continue to Traps")
        await elem.click(timeout=10000)
        
        # -> Continue from the Cognitive Traps & Reasoning Skills screen to Visuals.
        # Continue to Visuals button
        elem = page.get_by_role("button", name="Continue to Visuals")
        await elem.click(timeout=10000)
        
        # -> Open the configuration review for the Live Mini-Set run.
        # Review Configuration button
        elem = page.get_by_role("button", name="Review Configuration")
        await elem.click(timeout=10000)
        
        # -> Start the staged run using “Generate 5-Question Set (Live)” and check the resulting generation status.
        # Generate 5-Question Set (Live) button
        elem = page.get_by_role("button", name="Generate 5-Question Set (Live)")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The live generation pipeline is active.
        await page.locator("xpath=/html/body/div[1]/div/main/div/div[1]/div[1]/div[2]/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The live generation pipeline is active.
        await expect(page.locator("xpath=/html/body/div[1]/div/main/div/div[1]/div[1]/div[2]/button[1]").nth(0)).to_be_visible(timeout=15000), "The live generation pipeline is active."
        
        # --> Question slots are being prepared for the staged five-question run.
        await page.locator("div:nth-child(2) > div:nth-child(2) > div").first.nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: A staged question slot is being prepared.
        await expect(page.locator("div:nth-child(2) > div:nth-child(2) > div").first.nth(0)).to_be_visible(timeout=15000), "A staged question slot is being prepared."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    