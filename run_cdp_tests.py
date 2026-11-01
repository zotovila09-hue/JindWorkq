import subprocess
import json
import urllib.request
import time
import base64
import os
from cdp_client import SimpleWebSocket

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
user_data = f"C:/Users/Илья/AppData/Local/Temp/c_cdp_test_{int(time.time())}"
port = 9489
url = "file:///C:/Users/Илья/Desktop/Сайт/index.html"

proc = subprocess.Popen([
    chrome_path,
    "--headless=new",
    f"--remote-debugging-port={port}",
    f"--user-data-dir={user_data}",
    "--disable-gpu",
    "--disable-extensions",
    "--no-first-run",
    r"C:\Users\Илья\Desktop\Сайт\index.html"
])

def save_screenshot(ws, filename):
    res = ws.call("Page.captureScreenshot", {"format": "png"})
    b64 = res.get("result", {}).get("data")
    if b64:
        with open(filename, "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"Saved: {filename}")

def evaluate(ws, expr):
    res = ws.call("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    result_obj = res.get("result", {}).get("result", {})
    if "value" in result_obj:
        return result_obj["value"]
    if res.get("result", {}).get("exceptionDetails"):
        print("EVAL_ERROR:", res.get("result", {}).get("exceptionDetails"))
    return None

try:
    time.sleep(2)
    resp = urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list")
    tabs = json.loads(resp.read().decode())
    page_tabs = [t for t in tabs if t.get("type") == "page"]
    ws_url = page_tabs[0]["webSocketDebuggerUrl"] if page_tabs else tabs[0]["webSocketDebuggerUrl"]
    print("Connecting to tab:", page_tabs[0].get("title") if page_tabs else "first tab")
    ws = SimpleWebSocket(ws_url)

    # Enable Page and Runtime
    ws.call("Page.enable")
    ws.call("Runtime.enable")

    print("Connected to Chrome, waiting for DOM ready...")
    for _ in range(30):
        time.sleep(0.3)
        if evaluate(ws, "document.querySelector('.hero-title') !== null"):
            break

    # ---------------- TEST 1: MOBILE VIEWPORT (390x844) ----------------
    print("\n=== TEST 1: MOBILE VIEWPORT (390x844) ===")
    ws.call("Emulation.setDeviceMetricsOverride", {
        "width": 390,
        "height": 844,
        "deviceScaleFactor": 1,
        "mobile": False
    })
    time.sleep(0.8)

    inner_width = evaluate(ws, "window.innerWidth")
    scroll_width = evaluate(ws, "document.documentElement.scrollWidth")
    body_width = evaluate(ws, "document.body.scrollWidth")
    print(f"Mobile widths -> innerWidth: {inner_width}, scrollWidth: {scroll_width}, bodyWidth: {body_width}")
    assert scroll_width <= 390, f"FAILED: Document overflows 390px (scrollWidth={scroll_width})"
    print("PASS: Mobile document width strictly <= 390px!")

    # Check title visibility and bounding rect
    title_info = evaluate(ws, """
        (() => {
            const r = document.querySelector('.hero-title').getBoundingClientRect();
            return {x: Math.round(r.x), width: Math.round(r.width), right: Math.round(r.right)};
        })()
    """)
    print("Hero title rect on mobile:", title_info)
    assert title_info["right"] <= 390, "FAILED: Hero title overflows mobile right border"
    print("PASS: Hero title fits completely inside mobile viewport!")

    save_screenshot(ws, r"C:\Users\Илья\Desktop\Сайт\verified_mobile_hero.png")

    # Test Mobile Menu Open
    evaluate(ws, "document.getElementById('menu-toggle').click()")
    time.sleep(0.4)
    drawer_open = evaluate(ws, "document.getElementById('mobile-drawer').classList.contains('open')")
    print(f"Drawer opened: {drawer_open}")
    assert drawer_open, "FAILED: Mobile drawer did not open"
    save_screenshot(ws, r"C:\Users\Илья\Desktop\Сайт\verified_mobile_drawer.png")

    # Close Drawer
    evaluate(ws, "document.getElementById('drawer-close').click()")
    time.sleep(0.3)
    drawer_closed = evaluate(ws, "!document.getElementById('mobile-drawer').classList.contains('open')")
    assert drawer_closed, "FAILED: Mobile drawer did not close"
    print("PASS: Mobile drawer toggle and close verified!")

    # ---------------- TEST 2: DESKTOP VIEWPORT (1440x900) ----------------
    print("\n=== TEST 2: DESKTOP VIEWPORT (1440x900) ===")
    ws.call("Emulation.setDeviceMetricsOverride", {
        "width": 1440,
        "height": 900,
        "deviceScaleFactor": 1,
        "mobile": False
    })
    time.sleep(0.6)

    # 1. Verify removal of fake fluff & scroll-jacking
    print("\n--- Verifying Complete Removal of Scroll-Jacking & Fluff ---")
    giant_word = evaluate(ws, "document.querySelector('.hero-giant-word')")
    assert giant_word is None, "FAILED: Giant word banner must be completely removed"
    print("PASS: Giant 'Привет' banner is removed.")

    fake_sla = evaluate(ws, "document.body.innerText.includes('SLA & Warranty')")
    assert not fake_sla, "FAILED: 'SLA & Warranty' fake badge must be removed"
    print("PASS: Fake 'SLA & Warranty' badge is removed.")

    fake_qa = evaluate(ws, "document.body.innerText.includes('QA Verification Passed')")
    assert not fake_qa, "FAILED: Fake QA verification code line must be removed"
    print("PASS: Fake QA pseudocode is removed.")

    fake_horizontal = evaluate(ws, "document.querySelector('.services-horizontal-section')")
    assert fake_horizontal is None, "FAILED: services-horizontal-section must be completely removed"
    print("PASS: services-horizontal-section is completely removed.")

    fake_stack = evaluate(ws, "document.querySelector('.values-stack-section')")
    assert fake_stack is None, "FAILED: values-stack-section must be completely removed"
    print("PASS: values-stack-section is completely removed.")

    # 2. Verify Hero Offer & Structure
    hero_title_text = evaluate(ws, "document.querySelector('.hero-title').innerText")
    print(f"Hero Title: {hero_title_text}")
    assert "Разработка лендингов, Telegram-ботов и квизов с окупаемостью под трафик" in hero_title_text.replace("\u00a0", " ")

    hero_sub_text = evaluate(ws, "document.querySelector('.hero-subtitle').innerText")
    print(f"Hero Subtitle: {hero_sub_text}")
    assert "чистый код" in hero_sub_text

    hero_metrics = evaluate(ws, "Array.from(document.querySelectorAll('.metric-heading')).map(el => el.innerText.trim())")
    print(f"Hero Metrics: {hero_metrics}")
    assert any("Фиксированные дедлайны" in m for m in hero_metrics)
    assert any("Оплата 50/50 по факту" in m for m in hero_metrics)
    assert any("Гарантия 14 дней" in m for m in hero_metrics)
    print("PASS: Hero offer, subtitle, and key metrics verified!")

    save_screenshot(ws, r"C:\Users\Илья\Desktop\Сайт\verified_desktop_hero.png")

    # 3. Verify Services Grid (4 directions)
    print("\n--- Verifying Services Grid ---")
    services_top = evaluate(ws, "document.getElementById('services').offsetTop")
    evaluate(ws, f"window.scrollTo(0, {services_top - 60})")
    time.sleep(0.4)

    service_titles = evaluate(ws, "Array.from(document.querySelectorAll('.service-card .service-title')).map(el => el.innerText.trim())")
    print("Services titles:", service_titles)
    assert len(service_titles) == 4, f"FAILED: Expected 4 services, got {len(service_titles)}"
    assert "Лендинги под контекст и таргет" in service_titles
    assert "Telegram-боты и воронки" in service_titles
    assert "Конверсионные квизы" in service_titles
    assert "Интеграции и аналитика" in service_titles

    # Verify grid CSS display
    services_grid_display = evaluate(ws, "window.getComputedStyle(document.querySelector('.services-grid')).display")
    print(f"Services container display: {services_grid_display}")
    assert services_grid_display == "grid", "FAILED: Services must be CSS Grid"

    save_screenshot(ws, r"C:\Users\Илья\Desktop\Сайт\verified_services.png")
    print("PASS: 4 required services rendered in clean CSS Grid!")

    # 4. Verify Principles & Guarantees (Why us)
    print("\n--- Verifying Principles & Guarantees ---")
    values_top = evaluate(ws, "document.getElementById('values').offsetTop")
    evaluate(ws, f"window.scrollTo(0, {values_top - 60})")
    time.sleep(0.4)

    value_titles = evaluate(ws, "Array.from(document.querySelectorAll('.value-card .value-title')).map(el => el.innerText.trim())")
    print("Principles titles:", value_titles)
    assert len(value_titles) == 3, f"FAILED: Expected 3 guarantee cards, got {len(value_titles)}"
    assert any("50/50" in t for t in value_titles)
    assert any("14 дней гарантии" in t for t in value_titles)
    assert any("Командная скорость" in t for t in value_titles)

    # Check natural static positioning (no sticky JS stacking)
    card_position = evaluate(ws, "window.getComputedStyle(document.querySelector('.value-card')).position")
    print(f"Value card position: {card_position}")
    assert card_position == "static", f"FAILED: Expected static card position, got {card_position}"

    save_screenshot(ws, r"C:\Users\Илья\Desktop\Сайт\verified_why_us.png")
    print("PASS: 3 natural guarantee cards verified!")

    # 5. Verify Workflow (4 steps)
    print("\n--- Verifying Workflow (4 Steps) ---")
    workflow_top = evaluate(ws, "document.getElementById('workflow').offsetTop")
    evaluate(ws, f"window.scrollTo(0, {workflow_top - 60})")
    time.sleep(0.4)

    step_titles = evaluate(ws, "Array.from(document.querySelectorAll('.step-card .step-title')).map(el => el.innerText.trim())")
    print("Workflow step titles:", step_titles)
    assert len(step_titles) == 4, f"FAILED: Expected 4 steps, got {len(step_titles)}"
    assert "Брифинг в Telegram" in step_titles
    assert "Смета и прототип" in step_titles
    assert "Разработка и настройка аналитики" in step_titles
    assert "Запуск и гарантия" in step_titles

    save_screenshot(ws, r"C:\Users\Илья\Desktop\Сайт\verified_workflow.png")
    print("PASS: 4 workflow steps verified!")

    # 6. Verify Contact Section & Service Picker Interaction
    print("\n--- Verifying Contact Section & Service Picker ---")
    contact_top = evaluate(ws, "document.getElementById('contact').offsetTop")
    evaluate(ws, f"window.scrollTo(0, {contact_top - 60})")
    time.sleep(0.4)
    save_screenshot(ws, r"C:\Users\Илья\Desktop\Сайт\verified_contact.png")

    # Click service picker button
    evaluate(ws, "document.querySelector('.select-service-btn[data-service-name=\"Telegram-боты и воронки\"]').click()")
    time.sleep(0.3)
    c1 = evaluate(ws, "document.getElementById('project-comment').value")
    print("Comment after picking 'Telegram-боты и воронки':", repr(c1))
    assert "Выбранная услуга: Telegram-боты и воронки" in c1

    # Click another service picker button
    evaluate(ws, "document.querySelector('.select-service-btn[data-service-name=\"Лендинги под контекст и таргет\"]').click()")
    time.sleep(0.3)
    c2 = evaluate(ws, "document.getElementById('project-comment').value")
    print("Comment after switching to 'Лендинги под контекст и таргет':", repr(c2))
    assert "Выбранная услуга: Лендинги под контекст и таргет" in c2
    assert "Telegram-боты и воронки" not in c2, "FAILED: Duplicate services stacked in comment"
    print("PASS: Service selection updates comment cleanly without duplicate stacking!")

    # 7. Verify Form Validation & Submission
    print("\n--- Verifying Form Validation & Submission ---")
    # Test validation error trigger
    evaluate(ws, "document.getElementById('lead-form').dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}))")
    time.sleep(0.3)
    has_name_err = evaluate(ws, "document.getElementById('name-error').classList.contains('show')")
    has_tg_err = evaluate(ws, "document.getElementById('tg-error').classList.contains('show')")
    print(f"Validation errors visible on empty submit: name_err={has_name_err}, tg_err={has_tg_err}")
    assert has_name_err and has_tg_err, "FAILED: Empty fields must show validation errors"

    # Fill in valid form
    evaluate(ws, """
        document.getElementById('client-name').value = 'Михаил Решетников';
        document.getElementById('telegram-username').value = '@mikhail_lead';
        document.querySelector('input[name="urgency"][value="Срочно (1-3 дня)"]').checked = true;
        document.getElementById('lead-form').dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}));
    """)
    time.sleep(1.0)

    # Check LocalStorage
    leads_json = evaluate(ws, "localStorage.getItem('jindwork_leads')")
    leads = json.loads(leads_json or "[]")
    print(f"Stored leads count: {len(leads)}")
    print("Latest lead:", leads[-1] if leads else None)
    assert len(leads) > 0, "FAILED: Lead was not stored in localStorage"
    assert leads[-1]["fullName"] == "Михаил Решетников"
    assert leads[-1]["telegram"] == "@mikhail_lead"

    # Check Success Modal
    modal_open = evaluate(ws, "document.getElementById('success-modal').classList.contains('open')")
    tg_btn_href = evaluate(ws, "document.getElementById('modal-tg-btn').getAttribute('href')")
    print(f"Success modal open: {modal_open}")
    print(f"Modal Telegram button href: {tg_btn_href}")
    assert modal_open, "FAILED: Success modal did not open"
    assert "t.me/JindWork" in tg_btn_href, "FAILED: Modal TG button missing proper handle"
    assert "mikhail_lead" in tg_btn_href, "FAILED: Modal TG button missing prefilled telegram username"

    save_screenshot(ws, r"C:\Users\Илья\Desktop\Сайт\verified_modal_open.png")

    # Close modal
    evaluate(ws, "document.getElementById('modal-close-btn').click()")
    time.sleep(0.3)
    modal_closed = evaluate(ws, "!document.getElementById('success-modal').classList.contains('open')")
    assert modal_closed, "FAILED: Modal did not close"
    print("PASS: Form submission, LocalStorage persistence, success modal and TG link verified!")

    print("\n================ ALL TESTS PASSED SUCCESSFULLY! ================")

finally:
    try:
        ws.close()
    except:
        pass
    proc.terminate()
