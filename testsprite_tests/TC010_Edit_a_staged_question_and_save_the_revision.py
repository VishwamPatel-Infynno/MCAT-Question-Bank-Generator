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

        # -> Open the question creation flow using “Get Started - Create Questions.”
        # Get Started - Create Questions button
        elem = page.get_by_role("button", name="Get Started - Create Questions")
        await elem.click(timeout=10000)

        # -> Continue from the selected exam section to choose a unit.
        # Continue to Unit button
        elem = page.get_by_role("button", name="Continue to Unit")
        await elem.click(timeout=10000)

        # -> Continue to topic selection using the visible “Continue to Topic” control.
        # Continue to Topic button
        elem = page.get_by_role("button", name="Continue to Topic")
        await elem.click(timeout=10000)

        # -> Continue from the selected topic and concept to the difficulty settings.
        # Continue to Level button
        elem = page.get_by_role("button", name="Continue to Level")
        await elem.click(timeout=10000)

        # -> Choose “Live Mini-Set (5 Qs)” so the generated questions are staged for review.
        # 🎯 Live Mini-Set (5 Qs) Staged Batch Desk... button
        elem = page.get_by_role("button", name="🎯 Live Mini-Set (5 Qs)")
        await elem.click(timeout=10000)

        # -> Continue from the selected Live Mini-Set setting to configure the question traps.
        # Continue to Traps button
        elem = page.get_by_role("button", name="Continue to Traps")
        await elem.click(timeout=10000)

        # -> Continue from the cognitive traps settings to the visual configuration stage.
        # Continue to Visuals button
        elem = page.get_by_role("button", name="Continue to Visuals")
        await elem.click(timeout=10000)

        # -> Open the configuration review using “Review Configuration.”
        # Review Configuration button
        elem = page.get_by_role("button", name="Review Configuration")
        await elem.click(timeout=10000)

        # -> Generate the configured five-question live set and inspect the staged questions when generation completes.
        # Generate 5-Question Set (Live) button
        elem = page.get_by_role("button", name="Generate 5-Question Set (Live)")
        await elem.click(timeout=10000)

        # -> Open the first staged question’s “Detailed View” to inspect its editing controls.
        # Detailed View button
        elem = page.locator("div:nth-child(6) > button").first
        await elem.click(timeout=10000)

        # -> Open the staged question’s “Quick Edit” controls to make a content revision.
        # Quick Edit E button
        elem = page.get_by_role("button", name="Quick Edit E")
        await elem.click(timeout=10000)

        # -> Revise the text of the first answer choice in Quick Edit and check that the change appears before saving.
        # text field
        elem = page.locator("div").filter(has_text=re.compile(r"^A13w$")).get_by_role("textbox")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(
            "Both the x-intercept and the y-intercept shift to significantly higher absolute values (revised)."
        )

        # -> Save the revised answer choice and verify the question remains available for review.
        # Save button
        elem = page.get_by_role("button", name="Save", exact=True)
        await elem.click(timeout=10000)

        # --> Assertions to verify final state

        # --> The revised answer choice remains visible in the staged question.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The revised answer choice remains visible.
        (
            await expect(page.get_by_role("main").nth(0)).to_contain_text(
                "Both the x-intercept and the y-intercept shift to significantly higher absolute values (revised).",
                timeout=15000,
            ),
            "The revised answer choice remains visible.",
        )

        # --> The staged question remains available for review.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: The staged question is marked ready for review.
        (
            await expect(page.get_by_role("main").nth(0)).to_contain_text(
                "Ready for Review", timeout=15000
            ),
            "The staged question is marked ready for review.",
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
