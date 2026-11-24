"""End-to-end check of the built demo in a real browser (Chrome via Playwright).

Usage: npm run build && npx vite preview --port 4173 &  then  python3 e2e/demo_e2e.py
Walks the nine demonstrator steps across roles and all eight languages and fails on any
console error, page error or failed request.
"""

import re
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"

TITLES = {
    "en": "Standard parcel pickup",
    "kn": "ಸಾಮಾನ್ಯ ಪಾರ್ಸೆಲ್ ಪಿಕಪ್",
    "ta": "வழக்கமான பார்சல் பிக்அப்",
    "te": "సాధారణ పార్సెల్ పికప్",
    "hi": "सामान्य पार्सल पिकअप",
    "ml": "സാധാരണ പാഴ്സൽ പിക്കപ്പ്",
    "mr": "सामान्य पार्सल पिकअप",
    "bn": "সাধারণ পার্সেল পিকআপ",
}
LANG_OPTION = {"en": "English", "kn": "Kannada", "ta": "Tamil", "te": "Telugu", "hi": "Hindi", "ml": "Malayalam", "mr": "Marathi", "bn": "Bengali"}


def option_label(page, select, startswith):
    for opt in select.locator("option").all():
        text = opt.inner_text()
        if text.startswith(startswith):
            return text
    raise AssertionError(f"no option starting with {startswith}")


def main() -> None:
    problems: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1400, "height": 1000}, accept_downloads=True)
        page = context.new_page()
        page.on("console", lambda m: m.type == "error" and problems.append(f"console: {m.text}"))
        page.on("pageerror", lambda e: problems.append(f"pageerror: {e}"))
        page.on("requestfailed", lambda r: problems.append(f"requestfailed: {r.url}"))
        page.on("response", lambda r: r.status >= 400 and problems.append(f"http {r.status}: {r.url}"))

        def sign_in(name: str) -> None:
            page.goto(BASE + "/login")
            ready = page.get_by_text("Demo identities").or_(page.get_by_role("button", name="Switch identity"))
            expect(ready).to_be_visible(timeout=30000)
            if page.get_by_role("button", name="Switch identity").count():
                page.get_by_role("button", name="Switch identity").click()
            page.get_by_role("button", name=re.compile("^" + re.escape(name))).click()
            expect(page.get_by_role("heading", name=re.compile("^Welcome"))).to_be_visible()

        def nav(label: str) -> None:
            page.get_by_role("navigation", name="Main").get_by_role("link", name=label).click()

        page.goto(BASE + "/")
        expect(page.get_by_text("Demo identities")).to_be_visible(timeout=30000)

        # Step 4 + 9: worker asks in all eight languages (map-free).
        sign_in("Arjun")
        nav("Ask (task → answer)")
        form = page.locator("form")
        for code, title in TITLES.items():
            lang_select = form.locator("select").nth(0)
            lang_select.select_option(label=option_label(page, lang_select, LANG_OPTION[code]))
            form.locator("select").nth(1).select_option("T-PICKUP")
            form.locator("button[type=submit]").click()
            expect(page.locator(".answer-ok h2")).to_have_text(title)
            expect(page.locator(".answer-ok")).to_contain_text("15 kg")
            expect(page.locator(".answer-ok .media-grid figure")).to_have_count(1)
        print("ask: 8 languages answered verbatim")

        # Situation not covered -> abstain (localized), restricted task -> not permitted.
        form.locator("select").nth(2).select_option("LEAKING_CONTENTS")
        form.locator("button[type=submit]").click()
        expect(page.locator(".answer-abstain")).to_contain_text("situation_not_covered")
        form.locator("select").nth(2).select_option("")
        form.locator("select").nth(1).select_option("T-COD-REVIEW")
        form.locator("button[type=submit]").click()
        expect(page.locator(".answer-refused")).to_contain_text("role_not_permitted")
        # Free-text query in Hindi script.
        form.locator("select").nth(1).select_option("")
        form.locator("select").nth(0).select_option("hi")
        form.locator("input").fill("पैकेजिंग फटी")
        form.locator("button[type=submit]").click()
        expect(page.locator(".answer-ok h2")).to_have_text("पिकअप के समय क्षतिग्रस्त पैकेजिंग")
        print("ask: abstain, refusal and native-script search ok")

        # Step 6: guided then independent practice in Tamil.
        nav("Practice")
        page.get_by_role("button", name=re.compile("Guided practice")).click()
        page.get_by_label("Language").last.select_option("ta")
        page.locator(".choice").filter(has_text="இடைநிறுத்தி").first.click()
        page.get_by_role("button", name=re.compile("Submit decision|முடிவைச் சமர்ப்பிக்கவும்")).click()
        expect(page.locator(".scenario-result.ok")).to_be_visible()
        expect(page.locator(".blocks[lang=ta]")).to_be_visible()
        page.get_by_role("button", name=re.compile("சுயாதீன மதிப்பீடு")).first.click()  # labels follow the chosen language
        expect(page.get_by_role("button", name=re.compile("Show a hint|குறிப்பைக் காட்டு"))).to_have_count(0)
        print("practice: guided + independent ok")

        # Conveyor technician, Malayalam, annotated diagram in the answer.
        sign_in("Lakshmi")
        nav("Ask (task → answer)")
        form = page.locator("form")
        lang_select = form.locator("select").nth(0)
        lang_select.select_option(label=option_label(page, lang_select, "Malayalam"))
        form.locator("select").nth(1).select_option("T-CONV-INSPECT")
        form.locator("select").nth(4).select_option("CV-1000")
        form.locator("button[type=submit]").click()
        expect(page.locator(".answer-ok h2")).to_have_text("കൺവെയർ CV-1000 ദൈനംദിന പരിശോധന")
        expect(page.locator(".answer-ok img")).to_have_count(2)
        print("ask: HIGH-risk conveyor in Malayalam with diagrams ok")

        # Steps 1, 2, 8: author uploads revision 2 -> dependent knowledge suspended.
        sign_in("Asha")
        nav("Knowledge Studio")
        with page.expect_download() as dl:
            page.get_by_role("button", name=re.compile("Pickup SOP r2")).click()
        r2 = Path(tempfile.mkdtemp()) / "sop-dl-014-parcel-pickup-r2.md"
        dl.value.save_as(r2)
        page.locator("input[type=file]").set_input_files(str(r2))
        page.get_by_label(re.compile("I confirm this material")).check()
        page.get_by_role("button", name="Upload source").click()
        expect(page.get_by_text("(revision 2)")).to_be_visible()
        row = page.locator("tr", has_text="r2").first
        row.get_by_role("button", name="Extract drafts").click()
        expect(page.get_by_text(re.compile(r"draft\(s\) created"))).to_be_visible()
        print("studio: revision uploaded and extracted")

        # DOCX upload path.
        with page.expect_download() as dl:
            page.get_by_role("button", name="Conveyor SOP (.docx)").click()
        docx_path = Path(tempfile.mkdtemp()) / "conveyor-copy.docx"
        dl.value.save_as(docx_path)
        page.get_by_label("Document key (optional)").fill("sop-mt-099")
        page.locator("input[type=file]").set_input_files(str(docx_path))
        page.get_by_label(re.compile("I confirm this material")).check()
        page.get_by_role("button", name="Upload source").click()
        expect(page.get_by_text("Uploaded Conveyor CV-1000 daily inspection (revision 1).")).to_be_visible()
        print("studio: DOCX parsed in the browser")

        # Worker now gets no pickup answer (suspended), proving old answers are blocked.
        sign_in("Arjun")
        nav("Ask (task → answer)")
        form = page.locator("form")
        form.locator("select").nth(1).select_option("T-PICKUP")
        form.locator("button[type=submit]").click()
        expect(page.locator(".answer-abstain")).to_be_visible()
        print("delivery: suspended version no longer served")

        # Step 3: SME publishes the new pickup draft (12 kg) and the flagged address object.
        sign_in("Vikram")
        nav("Knowledge Studio")
        page.get_by_role("link", name=re.compile("^Standard parcel pickup")).first.click()
        page.get_by_role("button", name="Submit for review").click()
        expect(page.get_by_role("button", name="Approve and publish")).to_be_visible()
        page.get_by_label("Risk class").select_option("LOW")
        page.get_by_label("Distribution class").select_option("general")
        page.get_by_role("button", name="Approve and publish").click()
        expect(page.locator(".page-head .badge.state-published")).to_be_visible()
        print("review: new pickup version published")

        nav("Review queue")
        page.get_by_role("link", name=re.compile("^Address mismatch")).click()
        expect(page.get_by_text(re.compile("Source revised; re-extract"))).to_be_visible()
        page.get_by_role("button", name="Mark flag resolved").click()
        page.get_by_role("button", name=re.compile("^Save changes")).click()
        expect(page.get_by_role("button", name=re.compile("^Save changes"))).to_be_disabled()
        page.get_by_label("Distribution class").select_option("general")
        page.get_by_role("button", name="Approve and publish").click()
        expect(page.get_by_role("alert")).to_contain_text("no longer the active revision")
        print("review: flag resolved; approval blocked because its source was revised")

        # Translate the new pickup version into Hindi; protected-term check first.
        sign_in("Asha")
        page.goto(BASE + "/library")
        page.get_by_label("Filter by state").select_option("published")
        page.get_by_role("link", name="Standard parcel pickup").first.click()
        page.get_by_role("tab", name="Languages").click()
        page.locator("button.lang-cell", has_text="हिन्दी").click()
        page.get_by_label("Title (Hindi)").fill("सामान्य पार्सल पिकअप")
        areas = page.locator(".translate-grid textarea")
        texts = [
            "पुष्टि करें कि ऐप में दिखाया गया पिकअप कोड पार्सल के लेबल से मेल खाता है।",
            "पार्सल उठाने से पहले उसका बारकोड स्कैन करें।",
            "जाँचें कि पार्सल का वज़न 15 kg से अधिक नहीं है।",
            "पार्सल को डिलीवरी बैग में सीधा रखें और बैग बंद करें।",
            "ऐप में पिकअप को पूरा चिह्नित करें।",
        ]
        for i, t in enumerate(texts):
            areas.nth(i).fill(t)
        page.get_by_role("button", name="Save translation draft").click()
        expect(page.get_by_text("Altered protected terms: 12, 12 kg")).to_be_visible()
        areas.nth(2).fill("जाँचें कि पार्सल का वज़न 12 kg से अधिक नहीं है; 12 kg से भारी पार्सल को दो लोग मिलकर उठाएँ।")
        page.get_by_role("button", name="Save translation draft").click()
        expect(page.get_by_text("Language approval")).to_be_visible()
        print("translation: protected terms enforced, Hindi draft saved")

        sign_in("Kavya")
        page.goto(BASE + "/review")
        page.locator("li", has_text="waiting for bilingual review").get_by_role("link").first.click()
        page.get_by_role("tab", name="Languages").click()
        page.locator("button.lang-cell", has_text="हिन्दी").click()
        page.get_by_role("button", name="Approve as bilingual reviewer").click()
        expect(page.locator("button.lang-cell", has_text="हिन्दी").locator(".badge")).to_have_text("approved")
        print("translation: Hindi approved by bilingual reviewer")

        # Step 5: localized slide for the new version, approved by the bilingual reviewer.
        sign_in("Asha")
        page.goto(BASE + "/library")
        page.get_by_label("Filter by state").select_option("published")
        page.get_by_role("link", name="Standard parcel pickup").first.click()
        page.get_by_role("tab", name="Controlled media").click()
        page.get_by_label("Slide language").select_option("hi")
        page.get_by_role("button", name="Generate slide").click()
        expect(page.get_by_text(re.compile("needs approval by another reviewer"))).to_be_visible()
        sign_in("Kavya")
        page.goto(BASE + "/review")
        page.locator("li", has_text="slide").get_by_role("link").first.click()
        page.get_by_role("tab", name="Controlled media").click()
        page.get_by_role("button", name="Approve", exact=True).click()
        expect(page.locator(".media-card .badge.state-approved")).to_have_count(1)
        print("media: Hindi slide generated, verified and approved")

        sign_in("Arjun")
        nav("Ask (task → answer)")
        form = page.locator("form")
        lang_select = form.locator("select").nth(0)
        lang_select.select_option(label=option_label(page, lang_select, "Hindi"))
        form.locator("select").nth(1).select_option("T-PICKUP")
        form.locator("button[type=submit]").click()
        expect(page.locator(".answer-ok")).to_contain_text("12 kg")
        expect(page.locator(".answer-ok .citation")).to_contain_text("r2")
        form.locator("select").nth(0).select_option(label=option_label(page, lang_select, "Kannada"))
        form.locator("button[type=submit]").click()
        expect(page.locator(".answer-abstain")).to_contain_text("language_not_approved")
        print("delivery: v2 served in Hindi; unapproved Kannada abstains")

        # Step 7: analytics reconcile.
        sign_in("Nisha")
        nav("Insights")
        expect(page.get_by_text("every dashboard total equals the raw stored event count")).to_be_visible(timeout=30000)
        expect(page.get_by_text("Knowledge requests by language")).to_be_visible()
        print("insights: reconciled")

        # Model A package.
        sign_in("Platform Admin")
        nav("Packages (Model A)")
        page.get_by_role("button", name="Export new package").click()
        expect(page.get_by_role("heading", name="Package v1")).to_be_visible()
        with page.expect_download() as dl:
            page.get_by_role("button", name="Download .zip").click()
        assert dl.value.suggested_filename == "knowledge-package-v1.zip"
        print("packages: exported and downloaded")

        # Persistence across reload, then reset.
        page.reload()
        expect(page.get_by_role("heading", name="Package v1")).to_be_visible(timeout=30000)
        page.get_by_role("button", name="Reset demo data").click()
        page.get_by_role("button", name="Reset", exact=True).click()
        expect(page.get_by_role("heading", name=re.compile("^Welcome"))).to_be_visible(timeout=30000)
        nav("Packages (Model A)")
        expect(page.get_by_text("No packages exported yet.")).to_be_visible()
        print("persistence + reset ok")

        browser.close()
    if problems:
        print("\nPROBLEMS:")
        for x in problems:
            print(" -", x)
        sys.exit(1)
    print("\nE2E PASSED with no console errors")


if __name__ == "__main__":
    main()
