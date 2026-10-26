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

        # -> Open the question creation form using “Get Started - Create Questions.”
        # Get Started - Create Questions button
        elem = page.get_by_role("button", name="Get Started - Create Questions")
        await elem.click(timeout=10000)

        # -> Continue from the selected Chemistry & Physics exam section to the Unit step.
        # Continue to Unit button
        elem = page.get_by_role("button", name="Continue to Unit")
        await elem.click(timeout=10000)

        # -> Continue to the Topic step using the visible “Continue to Topic” control.
        # Continue to Topic button
        elem = page.get_by_role("button", name="Continue to Topic")
        await elem.click(timeout=10000)

        # -> Select a target subtopic concept on the Topic step and verify the selection before continuing.
        # Atomic number and mass number button
        elem = page.get_by_role("button", name="Atomic number and mass number")
        await elem.click(timeout=10000)

        # -> Continue to the Level step and inspect the available difficulty choices.
        # Continue to Level button
        elem = page.get_by_role("button", name="Continue to Level")
        await elem.click(timeout=10000)

        # -> Choose “Quick Single Item (1 Q)” as the generation scope for a single-question review.
        # ⚡ Quick Single Item (1 Q) Live Workspace... button
        elem = page.get_by_role("button", name="⚡ Quick Single Item (1 Q)")
        await elem.click(timeout=10000)

        # -> Continue from the Level step to the Traps setup screen.
        # Continue to Traps button
        elem = page.get_by_role("button", name="Continue to Traps")
        await elem.click(timeout=10000)

        # -> Continue to the Visuals step using the visible “Continue to Visuals” button.
        # Continue to Visuals button
        elem = page.get_by_role("button", name="Continue to Visuals")
        await elem.click(timeout=10000)

        # -> Open the Review step by selecting “Review Configuration.”
        # Review Configuration button
        elem = page.get_by_role("button", name="Review Configuration")
        await elem.click(timeout=10000)

        # -> Start generating one question with “Generate Single Question (Live).”
        # Generate Single Question (Live) button
        elem = page.get_by_role("button", name="Generate Single Question (")
        await elem.click(timeout=10000)

        # -> Scroll down through the staged question to find its approval and save controls.
        await page.mouse.wheel(0, 300)

        # -> Save the staged question to the question bank and verify the on-screen confirmation and that the staged question is removed.
        # Save to Question Bank A button
        elem = page.get_by_role("button", name="Save to Question Bank A")
        await elem.click(timeout=10000)

        # -> Open “AI Validated” and check whether the approved question is still present in the staged list.
        # AI Validated 468 button
        elem = page.get_by_role("button", name="AI Validated")
        await elem.click(timeout=10000)

        # --> Assertions to verify final state

        # --> A success confirmation stated “Saved in Question Bank” after the question was approved.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The success confirmation should state that the question was saved in the Question Bank.
        (
            await expect(page.locator("#root").nth(0)).to_contain_text(
                "Saved in Question Bank", timeout=15000
            ),
            "The success confirmation should state that the question was saved in the Question Bank.",
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
