import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path('/workspace/herodigital-site/screens')
OUT.mkdir(exist_ok=True)
PAGES = [
    ('/', 'home'),
    ('/pricing/', 'pricing'),
    ('/websites/', 'websites'),
    ('/market-leader/', 'market-leader'),
    ('/dental-implants/', 'dental-implants'),
    ('/free-audit/', 'free-audit'),
]
WIDTHS = [1440, 390]
BASE = 'http://127.0.0.1:4321'

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/usr/bin/google-chrome',
            args=['--no-sandbox', '--disable-dev-shm-usage'],
        )
        for path, name in PAGES:
            for w in WIDTHS:
                page = await browser.new_page(
                    viewport={'width': w, 'height': 900 if w > 800 else 844},
                    device_scale_factor=2,
                )
                await page.goto(f'{BASE}{path}', wait_until='networkidle', timeout=60000)
                await page.evaluate('() => document.fonts.ready')
                await page.evaluate(
                    "() => { document.querySelectorAll('.nav-menu').forEach(n=>n.classList.remove('open')); if (document.activeElement) document.activeElement.blur(); window.scrollTo(0,0); }"
                )
                await page.wait_for_timeout(400)
                out = OUT / f'{name}-{w}.png'
                await page.screenshot(path=str(out), full_page=True, type='png')
                print('wrote', out, out.stat().st_size)
                await page.close()
        await browser.close()

asyncio.run(main())
