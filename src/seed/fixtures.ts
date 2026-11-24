// Synthetic source files used by the seed and offered as downloadable samples. Everything
// is fictional: organisation, procedures, codes and equipment.

import JSZip from "jszip";

export const PICKUP_SOP_FILENAME = "sop-dl-014-parcel-pickup.md";
export const PICKUP_SOP_R2_FILENAME = "sop-dl-014-parcel-pickup-r2.md";
export const CONVEYOR_SOP_FILENAME = "sop-mt-007-conveyor-inspection.docx";
export const CONVEYOR_FIGURE_FILENAME = "conveyor-cv1000-synthetic.svg";

function pickupSop(maxKg: number): string {
  return `Document ID: SOP-DL-014
Title: Parcel pickup and pickup exceptions
Owner: Synthetic Logistics Co. (fictional demonstration organisation)
Language: en
Roles: delivery_associate
Task ID: T-PICKUP
Escalation route: Hub supervisor via the in-app call button

# Purpose
This synthetic procedure exists only to demonstrate the governed knowledge workflow.
It is not a real client SOP and must not be used as operational guidance.

# Standard parcel pickup
1. Confirm the pickup code shown in the app matches the label on the parcel.
2. Scan the parcel barcode before you lift it.
3. Check that the parcel weighs no more than ${maxKg} kg; parcels above ${maxKg} kg need a two-person lift.
4. Place the parcel upright in the delivery bag and close the bag.
5. Mark the pickup as complete in the app.

# Damaged packaging at pickup
Situation: DAMAGED_PACKAGE
If the outer packaging is torn, wet or crushed, then do not accept the parcel as normal.
1. Pause the pickup in the app.
2. Take two photos of the damage: one of the label and one of the damaged area.
3. Record the condition as "Damaged at pickup" in the exception form.
Warning: Do not touch leaking contents; keep at least 1 m away and wait for instructions.
Do not repair or re-tape the packaging yourself.
Escalate to the hub supervisor if the sender insists on handing over the parcel.

# Address mismatch at pickup
Situation: ADDRESS_MISMATCH
Roles: delivery_associate, hub_supervisor
If the pickup address in the app differs from the address on the label, then stop before scanning.
1. Ask the sender to confirm the correct pickup address.
2. Record both addresses in the exception form as appropriate.
Contact your supervisor before you continue the pickup.

# Cash-on-delivery discrepancy review
Roles: hub_supervisor
Task ID: T-COD-REVIEW
1. Compare the collected amount with the amount shown in the settlement report.
2. Lock the settlement record when the difference is more than 50 rupees.
3. Record the reason code COD-DIFF in the review log.
Do not share settlement amounts with delivery associates.
`;
}

/** Revision 1 (seeded) and revision 2 (the weight limit changes; upload it to see suspension). */
export const PICKUP_SOP = pickupSop(15);
export const PICKUP_SOP_R2 = pickupSop(12);

type DocxPara = ["meta" | "p" | "h1" | "num", string];

export const CONVEYOR_SOP: DocxPara[] = [
  ["meta", "Document ID: SOP-MT-007"],
  ["meta", "Title: Conveyor CV-1000 daily inspection"],
  ["meta", "Language: en"],
  ["meta", "Roles: maintenance_technician"],
  ["meta", "Task ID: T-CONV-INSPECT"],
  ["meta", "Equipment model: CV-1000"],
  ["meta", "Assets: EQ-1000-A, EQ-1000-B"],
  ["meta", "Escalation route: Shift engineer on radio channel 3"],
  ["h1", "Purpose"],
  ["p", "Synthetic procedure for a fictional conveyor, for demonstration only."],
  ["h1", "Daily inspection of conveyor CV-1000"],
  ["p", "Before you begin, confirm the conveyor is stopped and the isolator is locked in the OFF position."],
  ["p", "Warning: Never reach into the belt area while the isolator is ON."],
  ["num", "Check the emergency stop button EST-1 by pressing and releasing it."],
  ["num", "Inspect the belt for cuts longer than 20 mm."],
  ["num", "Check the belt tension: deflection must be between 10 mm and 15 mm at the midpoint."],
  ["num", "Check that guard G-2 is fitted and all four bolts are tight."],
  ["num", "Record the readings in the inspection log."],
  ["p", "Do not restart the conveyor if any check fails."],
  ["p", "Escalate to the shift engineer if a belt cut is longer than 20 mm."],
];

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** A minimal, standards-conformant .docx (headings and a numbered list) built in the browser. */
export async function buildDocx(paragraphs: DocxPara[]): Promise<Uint8Array> {
  const body = paragraphs
    .map(([kind, text]) => {
      const props =
        kind === "h1"
          ? '<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>'
          : kind === "num"
            ? '<w:pPr><w:pStyle w:val="ListNumber"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>'
            : "";
      return `<w:p>${props}<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
    })
    .join("");
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/_rels/document.xml.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>',
  );
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}>` +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="ListNumber"><w:name w:val="List Number"/><w:basedOn w:val="Normal"/></w:style></w:styles>',
  );
  zip.file(
    "word/numbering.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ${W}>` +
      '<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum>' +
      '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>',
  );
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}</w:body></w:document>`);
  return zip.generateAsync({ type: "uint8array" });
}

/** A deliberately generic, synthetic line drawing of a conveyor (no real geometry). */
export const CONVEYOR_FIGURE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" width="900" height="420">
<rect width="900" height="420" fill="#ffffff"/>
<rect x="80" y="170" width="740" height="80" rx="40" fill="none" stroke="#222222" stroke-width="5"/>
<circle cx="120" cy="210" r="34" fill="none" stroke="#222222" stroke-width="4"/>
<circle cx="780" cy="210" r="34" fill="none" stroke="#222222" stroke-width="4"/>
<path d="M200 176V244M280 176V244M360 176V244M440 176V244M520 176V244M600 176V244M680 176V244" stroke="#999999" stroke-width="2"/>
<rect x="560" y="90" width="200" height="70" fill="none" stroke="#555555" stroke-width="4"/>
<circle cx="170" cy="90" r="30" fill="none" stroke="#aa1111" stroke-width="6"/>
<path d="M170 120V170" stroke="#555555" stroke-width="3"/>
<rect x="60" y="260" width="40" height="120" fill="none" stroke="#555555" stroke-width="3"/>
<rect x="800" y="260" width="40" height="120" fill="none" stroke="#555555" stroke-width="3"/>
<text x="20" y="405" font-family="sans-serif" font-size="14" fill="#666666">SYNTHETIC DIAGRAM - fictional conveyor, not real equipment</text>
</svg>
`;
