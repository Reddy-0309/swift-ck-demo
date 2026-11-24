"""End-to-end check of the built app in a real browser (Chrome via Playwright).

Usage: npm run build && npx vite preview --port 4173 &  then  python3 e2e/demo_e2e.py [base-url]
Walks the field app and the console across roles and all eight languages, and fails on any
console error, page error or failed request.
"""

import re
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"

PICKUP = {
    "en": "Standard parcel pickup",
    "kn": "ಸಾಮಾನ್ಯ ಪಾರ್ಸೆಲ್ ಪಿಕಪ್",
    "ta": "வழக்கமான பார்சல் பிக்அப்",
    "te": "సాధారణ పార్సెల్ పికప్",
    "hi": "सामान्य पार्सल पिकअप",
    "ml": "സാധാരണ പാഴ്സൽ പിക്കപ്പ്",
    "mr": "सामान्य पार्सल पिकअप",
    "bn": "সাধারণ পার্সেল পিকআপ",
}


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
        toast = page.locator(".toast")

        def sign_in(name: str) -> None:
            page.goto(BASE + "/signin")
            page.evaluate("localStorage.removeItem('sck-demo-user')")
            page.goto(BASE + "/signin")
            page.get_by_role("button", name=re.compile(name)).click()
            expect(page.locator(".field-body h1, .page-head h1").first).to_be_visible(timeout=30000)

        def field_language(code: str) -> None:
            page.locator("#field-language").select_option(code)

        page.goto(BASE + "/")
        expect(page.get_by_text("Choose who you are")).to_be_visible(timeout=60000)

        # Field app: the same task in all eight languages.
        sign_in("Arjun")
        for code, title in PICKUP.items():
            page.goto(BASE + "/field")
            field_language(code)
            page.locator(".tile").first.click()
            expect(page.locator(".answer-card h2")).to_have_text(title)
            expect(page.locator(".answer-card .procedure")).to_contain_text("15 kg")
            expect(page.locator(".field-media figure")).to_have_count(1)
        print("field: pickup answered in all 8 languages")

        field_language("en")
        page.get_by_role("button", name="Leaking contents").click()
        expect(page.locator(".no-answer")).to_contain_text("no approved guidance for this situation")
        page.get_by_role("button", name="Damaged packaging").click()
        expect(page.locator(".answer-card h2")).to_have_text("Damaged packaging at pickup")
        page.goto(BASE + "/field")
        field_language("hi")
        page.locator(".field-search input").fill("पैकेजिंग फटी")
        page.locator(".field-search button").click()
        expect(page.locator(".answer-card h2")).to_have_text("पिकअप के समय क्षतिग्रस्त पैकेजिंग")
        print("field: situations, uncovered situation and native-script search ok")

        page.goto(BASE + "/field/practice")
        field_language("ta")
        page.get_by_role("button", name=re.compile("வழிகாட்டப்பட்ட பயிற்சி")).click()
        page.locator(".choice").filter(has_text="இடைநிறுத்தி").first.click()
        page.get_by_role("button", name="முடிவைச் சமர்ப்பிக்கவும்").click()
        expect(page.locator(".result.ok")).to_be_visible()
        expect(page.locator(".procedure[lang=ta]")).to_be_visible()
        page.goto(BASE + "/field/practice")
        page.get_by_role("button", name=re.compile("சுயாதீன சோதனை")).click()
        expect(page.locator(".choice").first).to_be_visible()
        expect(page.get_by_role("button", name="குறிப்பைக் காட்டு")).to_have_count(0)
        print("field: guided and independent practice ok")

        sign_in("Lakshmi")
        field_language("ml")
        page.locator(".tile").first.click()
        expect(page.get_by_role("button", name="കൺവെയർ ലൈൻ A")).to_be_visible()
        expect(page.locator(".answer-card")).to_have_count(0)
        page.get_by_role("button", name="കൺവെയർ ലൈൻ A").click()
        expect(page.locator(".answer-card h2")).to_have_text("കൺവെയർ CV-1000 ദൈനംദിന പരിശോധന")
        expect(page.locator(".field-media img")).to_have_count(2)
        print("field: safety-critical conveyor check in Malayalam with diagrams ok")

        # Console: a revised SOP suspends live knowledge.
        sign_in("Asha")
        page.goto(BASE + "/sources")
        tmp = Path(tempfile.mkdtemp())
        with page.expect_download() as dl:
            page.get_by_role("button", name=re.compile("revision 2")).click()
        r2 = tmp / "sop-dl-014-parcel-pickup-r2.md"
        dl.value.save_as(r2)
        page.locator("input[type=file]").set_input_files(str(r2))
        page.get_by_label(re.compile("I confirm this document")).check()
        page.get_by_role("button", name="Upload", exact=True).click()
        expect(toast.filter(has_text="(revision 2)")).to_be_visible()
        page.locator("tr", has_text="revision 2").get_by_role("button", name="Create drafts").click()
        expect(toast.filter(has_text="drafts created")).to_be_visible()
        with page.expect_download() as dl:
            page.get_by_role("button", name=re.compile("Conveyor inspection SOP")).click()
        docx = tmp / "conveyor-copy.docx"
        dl.value.save_as(docx)
        page.locator("input[type=file]").set_input_files(str(docx))
        page.get_by_label("Document ID (optional)").fill("SOP-MT-099")
        page.get_by_label(re.compile("I confirm this document")).check()
        page.get_by_role("button", name="Upload", exact=True).click()
        expect(toast.filter(has_text="Conveyor CV-1000 daily inspection (revision 1)")).to_be_visible()
        print("console: revision 2 uploaded and extracted; DOCX parsed in the browser")

        sign_in("Arjun")
        field_language("en")
        page.locator(".tile").first.click()
        expect(page.locator(".no-answer")).to_be_visible()
        print("field: suspended procedure is no longer served")

        sign_in("Vikram")
        page.goto(BASE + "/knowledge")
        page.get_by_role("button", name="In progress").click()
        page.get_by_role("link", name=re.compile("^Standard parcel pickup")).click()
        page.get_by_role("button", name="Submit for review").click()
        expect(toast.filter(has_text="Submitted for review")).to_be_visible()
        page.get_by_role("button", name="Publish…").click()
        page.get_by_label("Risk").select_option("LOW")
        page.get_by_label("Who may receive it").select_option("general")
        page.get_by_role("dialog").get_by_role("button", name="Publish", exact=True).click()
        expect(toast.filter(has_text="Published")).to_be_visible()
        expect(page.locator(".page-head .pill-green").first).to_have_text("Live")
        print("console: new pickup version (12 kg) published")

        page.goto(BASE + "/")
        page.get_by_role("link", name=re.compile("Address mismatch at pickup")).click()
        page.get_by_role("button", name="Edit").click()
        page.get_by_role("button", name="Mark as reviewed").click()
        page.get_by_role("button", name="Save changes").click()
        expect(toast.filter(has_text="Changes saved")).to_be_visible()
        page.get_by_role("button", name="Publish…").click()
        page.get_by_label("Who may receive it").select_option("general")
        page.get_by_role("dialog").get_by_role("button", name="Publish", exact=True).click()
        expect(page.get_by_role("dialog").get_by_role("alert")).to_contain_text("no longer the active revision")
        page.get_by_role("dialog").get_by_role("button", name="Cancel").click()
        print("console: reviewed line saved; publishing blocked because its source changed")

        sign_in("Asha")
        page.goto(BASE + "/knowledge")
        page.get_by_role("link", name=re.compile("^Standard parcel pickup")).click()
        page.get_by_role("tab", name=re.compile("^Languages")).click()
        page.locator("button.lang-cell", has_text="हिन्दी").click()
        page.get_by_label("Title in Hindi").fill("सामान्य पार्सल पिकअप")
        areas = page.locator(".translate textarea")
        texts = [
            "पुष्टि करें कि ऐप में दिखाया गया पिकअप कोड पार्सल के लेबल से मेल खाता है।",
            "पार्सल उठाने से पहले उसका बारकोड स्कैन करें।",
            "जाँचें कि पार्सल का वज़न 15 kg से अधिक नहीं है।",
            "पार्सल को डिलीवरी बैग में सीधा रखें और बैग बंद करें।",
            "ऐप में पिकअप को पूरा चिह्नित करें।",
        ]
        for i, text in enumerate(texts):
            areas.nth(i).fill(text)
        page.get_by_role("button", name="Save translation").click()
        expect(page.get_by_text("Codes, units or numbers changed: 12, 12 kg")).to_be_visible()
        areas.nth(2).fill("जाँचें कि पार्सल का वज़न 12 kg से अधिक नहीं है; 12 kg से भारी पार्सल को दो लोग मिलकर उठाएँ।")
        page.get_by_role("button", name="Save translation").click()
        expect(toast.filter(has_text="Translation saved")).to_be_visible()
        print("console: protected terms enforced; Hindi translation saved")

        sign_in("Kavya")
        page.get_by_role("link", name=re.compile("Approve the HI translation")).click()
        page.get_by_role("button", name="Approve language").click()
        expect(toast.filter(has_text="Language review recorded")).to_be_visible()
        expect(page.locator("button.lang-cell", has_text="हिन्दी").locator(".pill")).to_have_text("Approved")
        print("console: Hindi approved by the language reviewer")

        sign_in("Asha")
        page.goto(BASE + "/knowledge")
        page.get_by_role("link", name=re.compile("^Standard parcel pickup")).click()
        page.get_by_role("tab", name=re.compile("^Media")).click()
        page.get_by_role("button", name="Slide", exact=True).click()
        page.get_by_role("dialog").get_by_label("Language").select_option("hi")
        page.get_by_role("dialog").get_by_role("button", name="Create").click()
        expect(toast.filter(has_text="Created")).to_be_visible()
        sign_in("Kavya")
        page.get_by_role("link", name=re.compile("slide")).first.click()
        page.get_by_role("button", name="Approve", exact=True).click()
        expect(toast.filter(has_text="Media approved")).to_be_visible()
        print("console: Hindi slide generated, text-verified and approved")

        sign_in("Arjun")
        field_language("hi")
        page.locator(".tile").first.click()
        expect(page.locator(".answer-card .procedure")).to_contain_text("12 kg")
        expect(page.locator(".provenance")).to_contain_text("r2")
        field_language("kn")
        expect(page.locator(".no-answer")).to_be_visible()
        print("field: version 2 served in Hindi; unapproved Kannada says so clearly")

        sign_in("Nisha")
        page.goto(BASE + "/insights")
        expect(page.get_by_text("matches the raw event count")).to_be_visible(timeout=30000)
        page.get_by_role("button", name="90 days").click()
        expect(page.get_by_text("Requests by language")).to_be_visible()
        page.get_by_role("tab", name="Review effort").click()
        expect(page.get_by_text("Review time per procedure and language")).to_be_visible()
        print("console: insights reconciled for every period")

        sign_in("Platform Admin")
        page.goto(BASE + "/packages")
        page.get_by_role("button", name="Export package").click()
        expect(toast.filter(has_text="Package 1 exported")).to_be_visible()
        with page.expect_download() as dl:
            page.get_by_role("button", name="Download").first.click()
        assert dl.value.suggested_filename == "swift-knowledge-package-v1.zip"
        page.goto(BASE + "/activity")
        expect(page.get_by_role("cell", name="Exported a knowledge package")).to_be_visible()
        print("console: package exported, downloaded and logged")

        page.goto(BASE + "/packages")
        expect(page.get_by_text("Package 1").first).to_be_visible(timeout=30000)
        page.get_by_role("button", name="Reset demo data").click()
        page.get_by_role("dialog").get_by_role("button", name="Reset demo data").click()
        expect(toast.filter(has_text="Demo data reset")).to_be_visible(timeout=60000)
        page.goto(BASE + "/packages")
        expect(page.get_by_text("No packages yet")).to_be_visible()
        print("persistence across reloads, and reset, ok")

        browser.close()
    if problems:
        print("\nPROBLEMS:")
        for x in problems:
            print(" -", x)
        sys.exit(1)
    print("\nE2E PASSED with no console errors")


if __name__ == "__main__":
    main()
