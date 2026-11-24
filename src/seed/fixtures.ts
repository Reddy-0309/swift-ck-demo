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

export const PLANT_SOP_FILENAME = "sop-mt-012-isolation-and-vehicle-checks.md";
export const BANK_SOP_FILENAME = "sop-br-003-branch-counter-procedures.md";
export const STORE_SOP_FILENAME = "sop-rt-005-store-floor-safety.md";

export const PLANT_SOP = `Document ID: SOP-MT-012
Title: Isolation and vehicle pre-use checks
Owner: Ironleaf Components Pvt. Ltd. (fictional demonstration organisation)
Language: en
Escalation route: Shift engineer on radio channel 3

# Purpose
This synthetic procedure exists only to demonstrate the governed knowledge workflow.
It is not a real client SOP and must not be used as operational guidance.

# Lockout and tagout before maintenance
Roles: maintenance_technician
Task ID: T-LOTO
Before you begin, tell the machine operator that maintenance is starting.
1. Turn the main isolator to OFF and fit your personal lock LK-7.
2. Attach a red DANGER tag with your name and the date.
3. Press the start button to confirm that the machine does not move.
4. Wait 5 min for the flywheel to stop completely.
Warning: Never remove another person's lock or tag.
Do not start work if the machine moves when you press the start button.
Escalate to the shift engineer if the isolator will not lock.

# Forklift pre-use check
Roles: forklift_operator
Task ID: T-FORKLIFT-CHECK
Equipment model: FL-25
Assets: FL-25-01, FL-25-02
1. Walk around the forklift and check the tyres and forks for cuts, cracks or bends.
2. Test the horn, the lights and the reversing alarm.
3. Test the service brake and the parking brake.
4. Record the hour meter reading on checklist form FL-CHK.
Do not use a forklift that fails any check; park it and remove the key.
Escalate to the shift engineer if the brakes or the steering fail.
`;

export const BANK_SOP = `Document ID: SOP-BR-003
Title: Branch counter procedures
Owner: Tamarind Co-operative Bank (fictional demonstration organisation)
Language: en
Escalation route: Branch manager on extension 201

# Purpose
This synthetic procedure exists only to demonstrate the governed knowledge workflow.
It is not a real client SOP and must not be used as operational guidance.

# Opening the cash counter
Roles: branch_officer
Task ID: T-CASH-OPEN
Before you begin, confirm that the second key holder is present.
1. Collect the cash box from the strong room together with the second key holder.
2. Count the opening cash in front of the second key holder.
3. Enter the opening balance in counter register CR-1 and ask the second key holder to countersign.
Do not open the counter if the count differs from the previous day's closing balance.
Escalate to the branch manager if the count differs by any amount.

# Customer identity check before account opening
Roles: branch_officer
Task ID: T-KYC-CHECK
1. Ask the customer for one photo identity document and one address document.
2. Check that the photo matches the customer and that the name matches application form AO-2.
3. Scan both documents and attach them to the application.
Do not accept a photocopy without seeing the original document.
Escalate to the branch manager if the documents do not match.

# Suspicious cash deposit
Roles: branch_officer, branch_manager
Task ID: T-SUSPICIOUS-TXN
If a customer deposits more than 50000 rupees in cash and will not state the source, then complete the deposit normally.
1. Complete the deposit in the normal way.
2. Record the details in internal alert form STR-INT within 1 h.
3. Inform the branch manager in person.
Do not tell the customer that an alert has been raised.
`;

const storeSop = `Document ID: SOP-RT-005
Title: Store floor safety
Owner: Corner Basket Stores (fictional demonstration organisation)
Language: en
Escalation route: Store manager on the store radio

# Purpose
This synthetic procedure exists only to demonstrate the governed knowledge workflow.
It is not a real client SOP and must not be used as operational guidance.

# Cleaning up a spill on the shop floor
Roles: store_associate
Task ID: T-SPILL
1. Stay next to the spill and ask a colleague to bring the spill kit.
2. Place the yellow wet-floor sign at least 2 m before the spill.
3. Wipe up the spill with the absorbent pads and dry the floor with a clean mop.
4. Remove the sign only when the floor is completely dry.
Do not leave a spill unattended, even for a short time.
Warning: Do not touch spilled chemicals with bare hands; wear the gloves from the spill kit.

# Daily fire exit and extinguisher check
Roles: store_associate
Task ID: T-FIRE-CHECK
1. Walk to every fire exit and push the door to check that it opens freely.
2. Check that each extinguisher gauge needle is in the green zone.
3. Check that the safety pin and seal of each extinguisher are in place.
4. Sign the fire check log FC-1 with the time of the check.
Do not lock or block a fire exit at any time.
Escalate to the store manager if an exit is blocked or a gauge is in the red zone.

# Customer injury in the store
Roles: store_associate
Task ID: T-CUSTOMER-INJURY
1. Stay with the customer and ask them not to move if they may be hurt.
2. Call the store first aider on the store radio.
3. Call 112 if the customer is unconscious or bleeding heavily.
Do not give the customer any medicine.
Escalate to the store manager after the first aider arrives.
`;

export const STORE_SOP = storeSop;

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
