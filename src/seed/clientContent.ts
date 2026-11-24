// Content for Swift's other fictional clients: translations of their procedures into the
// languages each client's workforce uses, and decision-practice scenarios. Indic wording is a
// demonstration draft that still needs review by a qualified native-speaker domain reviewer.
// Codes, units and numbers (LK-7, 5 min, FL-CHK, CR-1, AO-2, 50000, STR-INT, 1 h, 2 m, FC-1)
// are kept exactly as in English; the platform rejects a translation that changes them.

import type { Language } from "../domain/types";
import { buildDefinition } from "./scenario";

type Translation = { title: string; blocks: string[] };

export const LOTO_KEY = "sop-mt-012.lockout-and-tagout-before-maintenance";
export const FORKLIFT_KEY = "sop-mt-012.forklift-pre-use-check";
export const CASH_KEY = "sop-br-003.opening-the-cash-counter";
export const KYC_KEY = "sop-br-003.customer-identity-check-before-account-opening";
export const SUSPICIOUS_KEY = "sop-br-003.suspicious-cash-deposit";
export const SPILL_KEY = "sop-rt-005.cleaning-up-a-spill-on-the-shop-floor";
export const FIRE_KEY = "sop-rt-005.daily-fire-exit-and-extinguisher-check";
export const INJURY_KEY = "sop-rt-005.customer-injury-in-the-store";

/** Approved translations, per object and language. */
export const CLIENT_TRANSLATIONS: Record<string, Partial<Record<Language, Translation>>> = {
  [LOTO_KEY]: {
    ta: {
      title: "பராமரிப்புக்கு முன் லாக்அவுட் மற்றும் டேக்அவுட்",
      blocks: [
        "தொடங்குவதற்கு முன், பராமரிப்பு தொடங்குவதாக இயந்திர இயக்குநரிடம் தெரிவிக்கவும்.",
        "முதன்மை ஐசோலேட்டரை OFF நிலைக்குத் திருப்பி, உங்கள் தனிப்பட்ட பூட்டு LK-7-ஐப் பொருத்தவும்.",
        "உங்கள் பெயர் மற்றும் தேதியுடன் சிவப்பு DANGER குறிச்சீட்டை இணைக்கவும்.",
        "இயந்திரம் நகரவில்லை என்பதை உறுதிசெய்ய ஸ்டார்ட் பொத்தானை அழுத்தவும்.",
        "ஃப்ளைவீல் முழுமையாக நிற்க 5 min காத்திருக்கவும்.",
        "மற்றொருவரின் பூட்டையோ குறிச்சீட்டையோ ஒருபோதும் அகற்ற வேண்டாம்.",
        "ஸ்டார்ட் பொத்தானை அழுத்தும்போது இயந்திரம் நகர்ந்தால் வேலையைத் தொடங்க வேண்டாம்.",
        "ஐசோலேட்டர் பூட்டப்படாவிட்டால் ஷிஃப்ட் பொறியாளரிடம் தெரிவிக்கவும்.",
      ],
    },
    kn: {
      title: "ನಿರ್ವಹಣೆಗೆ ಮೊದಲು ಲಾಕ್‌ಔಟ್ ಮತ್ತು ಟ್ಯಾಗ್‌ಔಟ್",
      blocks: [
        "ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು, ನಿರ್ವಹಣೆ ಆರಂಭವಾಗುತ್ತಿದೆ ಎಂದು ಯಂತ್ರ ನಿರ್ವಾಹಕರಿಗೆ ತಿಳಿಸಿ.",
        "ಮುಖ್ಯ ಐಸೊಲೇಟರ್ ಅನ್ನು OFF ಸ್ಥಿತಿಗೆ ತಿರುಗಿಸಿ ಮತ್ತು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಬೀಗ LK-7 ಅನ್ನು ಹಾಕಿ.",
        "ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ದಿನಾಂಕದೊಂದಿಗೆ ಕೆಂಪು DANGER ಟ್ಯಾಗ್ ಅನ್ನು ಲಗತ್ತಿಸಿ.",
        "ಯಂತ್ರ ಚಲಿಸುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಲು ಸ್ಟಾರ್ಟ್ ಬಟನ್ ಒತ್ತಿರಿ.",
        "ಫ್ಲೈವೀಲ್ ಸಂಪೂರ್ಣವಾಗಿ ನಿಲ್ಲಲು 5 min ಕಾಯಿರಿ.",
        "ಬೇರೊಬ್ಬರ ಬೀಗ ಅಥವಾ ಟ್ಯಾಗ್ ಅನ್ನು ಎಂದಿಗೂ ತೆಗೆಯಬೇಡಿ.",
        "ಸ್ಟಾರ್ಟ್ ಬಟನ್ ಒತ್ತಿದಾಗ ಯಂತ್ರ ಚಲಿಸಿದರೆ ಕೆಲಸ ಆರಂಭಿಸಬೇಡಿ.",
        "ಐಸೊಲೇಟರ್ ಲಾಕ್ ಆಗದಿದ್ದರೆ ಶಿಫ್ಟ್ ಎಂಜಿನಿಯರ್‌ಗೆ ತಿಳಿಸಿ.",
      ],
    },
  },
  [FORKLIFT_KEY]: {
    ta: {
      title: "ஃபோர்க்லிஃப்ட் பயன்பாட்டுக்கு முன் சோதனை",
      blocks: [
        "ஃபோர்க்லிஃப்டைச் சுற்றி நடந்து, டயர்கள் மற்றும் ஃபோர்க்குகளில் வெட்டு, விரிசல் அல்லது வளைவு உள்ளதா எனச் சரிபார்க்கவும்.",
        "ஹாரன், விளக்குகள் மற்றும் ரிவர்சிங் அலாரத்தைச் சோதிக்கவும்.",
        "சர்வீஸ் பிரேக் மற்றும் பார்க்கிங் பிரேக்கைச் சோதிக்கவும்.",
        "ஹவர் மீட்டர் அளவீட்டைச் சரிபார்ப்புப் படிவம் FL-CHK-இல் பதிவு செய்யவும்.",
        "எந்தச் சோதனையிலாவது தோல்வியடைந்த ஃபோர்க்லிஃப்டைப் பயன்படுத்த வேண்டாம்; அதை நிறுத்தி சாவியை எடுத்துவிடவும்.",
        "பிரேக்குகள் அல்லது ஸ்டீயரிங் செயல்படாவிட்டால் ஷிஃப்ட் பொறியாளரிடம் தெரிவிக்கவும்.",
      ],
    },
    hi: {
      title: "फोर्कलिफ्ट उपयोग से पहले जाँच",
      blocks: [
        "फोर्कलिफ्ट के चारों ओर घूमकर टायरों और फोर्क में कट, दरार या मोड़ की जाँच करें।",
        "हॉर्न, लाइटें और रिवर्सिंग अलार्म जाँचें।",
        "सर्विस ब्रेक और पार्किंग ब्रेक जाँचें।",
        "आवर मीटर की रीडिंग चेकलिस्ट फ़ॉर्म FL-CHK में दर्ज करें।",
        "किसी भी जाँच में विफल फोर्कलिफ्ट का उपयोग न करें; उसे पार्क करें और चाबी निकाल लें।",
        "ब्रेक या स्टीयरिंग काम न करें तो शिफ्ट इंजीनियर को सूचित करें।",
      ],
    },
  },
  [CASH_KEY]: {
    kn: {
      title: "ನಗದು ಕೌಂಟರ್ ತೆರೆಯುವುದು",
      blocks: [
        "ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು, ಎರಡನೇ ಕೀ ಹೊಂದಿರುವವರು ಹಾಜರಿದ್ದಾರೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
        "ಎರಡನೇ ಕೀ ಹೊಂದಿರುವವರೊಂದಿಗೆ ಸ್ಟ್ರಾಂಗ್ ರೂಮ್‌ನಿಂದ ನಗದು ಪೆಟ್ಟಿಗೆಯನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ.",
        "ಎರಡನೇ ಕೀ ಹೊಂದಿರುವವರ ಎದುರಿನಲ್ಲಿ ಆರಂಭಿಕ ನಗದನ್ನು ಎಣಿಸಿ.",
        "ಆರಂಭಿಕ ಬಾಕಿಯನ್ನು ಕೌಂಟರ್ ರಿಜಿಸ್ಟರ್ CR-1 ನಲ್ಲಿ ನಮೂದಿಸಿ ಮತ್ತು ಎರಡನೇ ಕೀ ಹೊಂದಿರುವವರಿಂದ ಪ್ರತಿಸಹಿ ಪಡೆಯಿರಿ.",
        "ಎಣಿಕೆ ಹಿಂದಿನ ದಿನದ ಮುಕ್ತಾಯ ಬಾಕಿಗಿಂತ ಭಿನ್ನವಾಗಿದ್ದರೆ ಕೌಂಟರ್ ತೆರೆಯಬೇಡಿ.",
        "ಎಣಿಕೆಯಲ್ಲಿ ಯಾವುದೇ ಮೊತ್ತದ ವ್ಯತ್ಯಾಸವಿದ್ದರೆ ಶಾಖಾ ವ್ಯವಸ್ಥಾಪಕರಿಗೆ ತಿಳಿಸಿ.",
      ],
    },
    hi: {
      title: "नकद काउंटर खोलना",
      blocks: [
        "शुरू करने से पहले, पुष्टि करें कि दूसरा चाबीधारक मौजूद है।",
        "दूसरे चाबीधारक के साथ स्ट्रांग रूम से कैश बॉक्स लें।",
        "दूसरे चाबीधारक के सामने शुरुआती नकदी गिनें।",
        "शुरुआती शेष राशि काउंटर रजिस्टर CR-1 में दर्ज करें और दूसरे चाबीधारक से प्रतिहस्ताक्षर करवाएँ।",
        "यदि गिनती पिछले दिन की अंतिम शेष राशि से अलग है, तो काउंटर न खोलें।",
        "गिनती में किसी भी राशि का अंतर हो तो शाखा प्रबंधक को सूचित करें।",
      ],
    },
  },
  [KYC_KEY]: {
    kn: {
      title: "ಖಾತೆ ತೆರೆಯುವ ಮೊದಲು ಗ್ರಾಹಕರ ಗುರುತಿನ ಪರಿಶೀಲನೆ",
      blocks: [
        "ಗ್ರಾಹಕರಿಂದ ಒಂದು ಫೋಟೋ ಗುರುತಿನ ದಾಖಲೆ ಮತ್ತು ಒಂದು ವಿಳಾಸ ದಾಖಲೆಯನ್ನು ಕೇಳಿ.",
        "ಫೋಟೋ ಗ್ರಾಹಕರಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆಯೇ ಮತ್ತು ಹೆಸರು ಅರ್ಜಿ ನಮೂನೆ AO-2 ಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.",
        "ಎರಡೂ ದಾಖಲೆಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅರ್ಜಿಗೆ ಲಗತ್ತಿಸಿ.",
        "ಮೂಲ ದಾಖಲೆಯನ್ನು ನೋಡದೆ ಫೋಟೋಕಾಪಿಯನ್ನು ಸ್ವೀಕರಿಸಬೇಡಿ.",
        "ದಾಖಲೆಗಳು ಹೊಂದಿಕೆಯಾಗದಿದ್ದರೆ ಶಾಖಾ ವ್ಯವಸ್ಥಾಪಕರಿಗೆ ತಿಳಿಸಿ.",
      ],
    },
    hi: {
      title: "खाता खोलने से पहले ग्राहक की पहचान जाँच",
      blocks: [
        "ग्राहक से एक फ़ोटो पहचान दस्तावेज़ और एक पते का दस्तावेज़ माँगें।",
        "जाँचें कि फ़ोटो ग्राहक से मेल खाती है और नाम आवेदन फ़ॉर्म AO-2 से मेल खाता है।",
        "दोनों दस्तावेज़ स्कैन करें और आवेदन के साथ संलग्न करें।",
        "मूल दस्तावेज़ देखे बिना फ़ोटोकॉपी स्वीकार न करें।",
        "दस्तावेज़ मेल न खाएँ तो शाखा प्रबंधक को सूचित करें।",
      ],
    },
  },
  [SUSPICIOUS_KEY]: {
    kn: {
      title: "ಅನುಮಾನಾಸ್ಪದ ನಗದು ಠೇವಣಿ",
      blocks: [
        "ಗ್ರಾಹಕರು 50000 ರೂಪಾಯಿಗಿಂತ ಹೆಚ್ಚು ನಗದು ಠೇವಣಿ ಇಟ್ಟು ಅದರ ಮೂಲವನ್ನು ತಿಳಿಸದಿದ್ದರೆ, ಠೇವಣಿಯನ್ನು ಸಾಮಾನ್ಯವಾಗಿ ಪೂರ್ಣಗೊಳಿಸಿ.",
        "ಠೇವಣಿಯನ್ನು ಸಾಮಾನ್ಯ ರೀತಿಯಲ್ಲಿ ಪೂರ್ಣಗೊಳಿಸಿ.",
        "ವಿವರಗಳನ್ನು 1 h ಒಳಗೆ ಆಂತರಿಕ ಎಚ್ಚರಿಕೆ ನಮೂನೆ STR-INT ನಲ್ಲಿ ದಾಖಲಿಸಿ.",
        "ಶಾಖಾ ವ್ಯವಸ್ಥಾಪಕರಿಗೆ ವೈಯಕ್ತಿಕವಾಗಿ ತಿಳಿಸಿ.",
        "ಎಚ್ಚರಿಕೆ ಎತ್ತಲಾಗಿದೆ ಎಂದು ಗ್ರಾಹಕರಿಗೆ ತಿಳಿಸಬೇಡಿ.",
      ],
    },
  },
  [SPILL_KEY]: {
    hi: {
      title: "दुकान के फ़र्श पर गिरी चीज़ साफ़ करना",
      blocks: [
        "गिरी हुई चीज़ के पास रहें और किसी सहकर्मी से स्पिल किट लाने को कहें।",
        "पीला वेट-फ़्लोर साइन गिरी हुई जगह से कम से कम 2 m पहले रखें।",
        "अवशोषक पैड से गिरी हुई चीज़ पोंछें और साफ़ पोछे से फ़र्श सुखाएँ।",
        "साइन तभी हटाएँ जब फ़र्श पूरी तरह सूख जाए।",
        "गिरी हुई चीज़ को थोड़ी देर के लिए भी बिना निगरानी के न छोड़ें।",
        "गिरे हुए रसायनों को नंगे हाथों से न छुएँ; स्पिल किट के दस्ताने पहनें।",
      ],
    },
    mr: {
      title: "दुकानाच्या जमिनीवर सांडलेले साफ करणे",
      blocks: [
        "सांडलेल्या जागेजवळ थांबा आणि सहकाऱ्याला स्पिल किट आणायला सांगा.",
        "पिवळा वेट-फ्लोअर फलक सांडलेल्या जागेच्या किमान 2 m आधी ठेवा.",
        "शोषक पॅडने सांडलेले पुसा आणि स्वच्छ मॉपने जमीन कोरडी करा.",
        "जमीन पूर्णपणे कोरडी झाल्यावरच फलक काढा.",
        "सांडलेली जागा थोड्या वेळासाठीही लक्ष न देता सोडू नका.",
        "सांडलेल्या रसायनांना उघड्या हातांनी स्पर्श करू नका; स्पिल किटमधील हातमोजे घाला.",
      ],
    },
  },
  [FIRE_KEY]: {
    hi: {
      title: "रोज़ाना फ़ायर एग्ज़िट और अग्निशामक जाँच",
      blocks: [
        "हर फ़ायर एग्ज़िट तक जाएँ और दरवाज़ा धकेलकर जाँचें कि वह आसानी से खुलता है।",
        "जाँचें कि हर अग्निशामक के गेज की सुई हरे क्षेत्र में है।",
        "जाँचें कि हर अग्निशामक की सेफ़्टी पिन और सील अपनी जगह पर हैं।",
        "फ़ायर चेक लॉग FC-1 में जाँच के समय के साथ हस्ताक्षर करें।",
        "किसी भी समय फ़ायर एग्ज़िट को बंद या अवरुद्ध न करें।",
        "कोई एग्ज़िट अवरुद्ध हो या गेज लाल क्षेत्र में हो तो स्टोर मैनेजर को सूचित करें।",
      ],
    },
    mr: {
      title: "दैनंदिन फायर एक्झिट आणि अग्निशामक तपासणी",
      blocks: [
        "प्रत्येक फायर एक्झिटपर्यंत जा आणि दार ढकलून ते सहज उघडते का ते तपासा.",
        "प्रत्येक अग्निशामकाच्या गेजची सुई हिरव्या भागात आहे का ते तपासा.",
        "प्रत्येक अग्निशामकाची सेफ्टी पिन आणि सील जागेवर आहेत का ते तपासा.",
        "फायर चेक लॉग FC-1 मध्ये तपासणीच्या वेळेसह सही करा.",
        "कोणत्याही वेळी फायर एक्झिट कुलूपबंद किंवा अडवू नका.",
        "एखादा एक्झिट अडवलेला असेल किंवा गेज लाल भागात असेल तर स्टोअर मॅनेजरला कळवा.",
      ],
    },
  },
};

/** Drafted but not yet approved: shows a translation waiting in the language reviewer's inbox. */
export const PENDING_TRANSLATIONS: { key: string; language: Language; translation: Translation }[] = [
  {
    key: SPILL_KEY,
    language: "bn",
    translation: {
      title: "দোকানের মেঝেতে পড়ে যাওয়া জিনিস পরিষ্কার করা",
      blocks: [
        "পড়ে যাওয়া জিনিসের পাশে থাকুন এবং একজন সহকর্মীকে স্পিল কিট আনতে বলুন।",
        "হলুদ ওয়েট-ফ্লোর চিহ্নটি পড়ে যাওয়া জায়গা থেকে অন্তত 2 m আগে রাখুন।",
        "শোষক প্যাড দিয়ে মুছে ফেলুন এবং পরিষ্কার মপ দিয়ে মেঝে শুকিয়ে নিন।",
        "মেঝে পুরোপুরি শুকিয়ে গেলে তবেই চিহ্নটি সরান।",
        "অল্প সময়ের জন্যও পড়ে যাওয়া জিনিস নজরের বাইরে রেখে যাবেন না।",
        "খালি হাতে পড়ে যাওয়া রাসায়নিক স্পর্শ করবেন না; স্পিল কিটের দস্তানা পরুন।",
      ],
    },
  },
];

// ----------------------------------------------------------------------------- practice

export const LOTO_SCENARIO_KEY = "lockout-restart-request";
export const KYC_SCENARIO_KEY = "kyc-name-mismatch";
export const SPILL_SCENARIO_KEY = "spill-busy-aisle";

export const LOTO_SCENARIO = buildDefinition(
  {
    en: {
      situation: "You are replacing a belt on a press. Your lock LK-7 and your tag are on the isolator.",
      rules: ["Keep the isolation in place until the work is finished", "Never remove another person's lock or tag", "Escalate when the isolation cannot be kept"],
      guidedPrompt: "Halfway through the job, the operator asks you to switch the press on for one minute to clear a queue. What do you do?",
      hints: ["Open the 'Lockout and tagout before maintenance' guide.", "Ask yourself who the lock protects while your hands are in the machine."],
      guided: {
        A: ["Remove your lock for one minute, then refit it", "The press starts while the belt guard is off; anyone nearby is exposed.", "The isolation must stay in place until the job is finished."],
        B: ["Keep your lock on and tell the operator the press stays off until you finish", "The queue waits a few minutes; nobody is exposed to moving parts.", "Correct: the isolation stays in place and the job finishes safely."],
        C: ["Ask the operator to remove your lock while you step back", "Someone else removed your lock: the protection is gone and the record is false.", "Never let anyone remove your lock or tag, and never remove theirs."],
      },
      independentPrompt: "You come back from a break and find a second lock next to yours on the isolator. The other technician has gone home. What do you do?",
      independent: {
        W: ["Cut the other lock off so you can finish your job", "Someone may still be working on the machine; their protection is removed.", "Never remove another person's lock or tag."],
        X: ["Leave both locks on and call the shift engineer", "The shift engineer confirms who owns the lock before anything changes.", "Correct: both isolations stay in place and the situation is escalated."],
        Y: ["Remove only your own lock and restart the press", "The press restarts while another isolation is still recorded.", "Do not restart while any isolation is in place; escalate instead."],
        Z: ["Leave both locks and go home without telling anyone", "The machine stays safe, but nobody knows why the job is stuck.", "Keeping the isolation is right, but you must also escalate."],
      },
    },
    ta: {
      situation: "நீங்கள் ஒரு பிரஸ்ஸில் பெல்ட்டை மாற்றுகிறீர்கள். உங்கள் பூட்டு LK-7 மற்றும் குறிச்சீட்டு ஐசோலேட்டரில் உள்ளன.",
      rules: ["வேலை முடியும் வரை தனிமைப்படுத்தலை அப்படியே வைத்திருக்கவும்", "மற்றொருவரின் பூட்டையோ குறிச்சீட்டையோ ஒருபோதும் அகற்ற வேண்டாம்", "தனிமைப்படுத்தலைத் தொடர முடியாவிட்டால் மேலதிகாரியிடம் தெரிவிக்கவும்"],
      guidedPrompt: "வேலையின் பாதியில், வரிசையைச் சரிசெய்ய பிரஸ்ஸை ஒரு நிமிடம் இயக்கும்படி இயக்குநர் கேட்கிறார். நீங்கள் என்ன செய்வீர்கள்?",
      hints: ["'பராமரிப்புக்கு முன் லாக்அவுட் மற்றும் டேக்அவுட்' வழிகாட்டியைத் திறக்கவும்.", "உங்கள் கைகள் இயந்திரத்துக்குள் இருக்கும்போது பூட்டு யாரைப் பாதுகாக்கிறது என்று யோசியுங்கள்."],
      guided: {
        A: ["ஒரு நிமிடம் உங்கள் பூட்டை அகற்றி, பிறகு மீண்டும் பொருத்துவது", "பெல்ட் காவல் இல்லாத நிலையில் பிரஸ் இயங்குகிறது; அருகில் உள்ள அனைவரும் ஆபத்தில் உள்ளனர்.", "வேலை முடியும் வரை தனிமைப்படுத்தல் அப்படியே இருக்க வேண்டும்."],
        B: ["பூட்டை அப்படியே வைத்து, வேலை முடியும் வரை பிரஸ் இயங்காது என்று இயக்குநரிடம் சொல்வது", "வரிசை சில நிமிடங்கள் காத்திருக்கிறது; யாரும் நகரும் பாகங்களால் ஆபத்தில் இல்லை.", "சரி: தனிமைப்படுத்தல் அப்படியே உள்ளது, வேலை பாதுகாப்பாக முடிகிறது."],
        C: ["நீங்கள் விலகி நிற்கும்போது உங்கள் பூட்டை அகற்றும்படி இயக்குநரிடம் கேட்பது", "வேறொருவர் உங்கள் பூட்டை அகற்றினார்: பாதுகாப்பு போய்விட்டது, பதிவும் தவறாகிவிட்டது.", "உங்கள் பூட்டை யாரையும் அகற்ற விடாதீர்கள்; அவர்களுடையதையும் நீங்கள் அகற்றாதீர்கள்."],
      },
      independentPrompt: "இடைவேளைக்குப் பின் திரும்பி வரும்போது, ஐசோலேட்டரில் உங்கள் பூட்டின் அருகே இரண்டாவது பூட்டு இருக்கிறது. மற்ற தொழில்நுட்பர் வீட்டுக்குச் சென்றுவிட்டார். நீங்கள் என்ன செய்வீர்கள்?",
      independent: {
        W: ["உங்கள் வேலையை முடிக்க மற்றப் பூட்டை வெட்டி எடுப்பது", "இன்னும் யாராவது இயந்திரத்தில் வேலை செய்யக்கூடும்; அவரின் பாதுகாப்பு அகற்றப்படுகிறது.", "மற்றொருவரின் பூட்டையோ குறிச்சீட்டையோ ஒருபோதும் அகற்ற வேண்டாம்."],
        X: ["இரண்டு பூட்டுகளையும் அப்படியே விட்டு ஷிஃப்ட் பொறியாளரை அழைப்பது", "எதையும் மாற்றுவதற்கு முன் பூட்டு யாருடையது என்பதை ஷிஃப்ட் பொறியாளர் உறுதிசெய்கிறார்.", "சரி: இரண்டு தனிமைப்படுத்தல்களும் அப்படியே உள்ளன, நிலைமை மேலதிகாரிக்குத் தெரிவிக்கப்படுகிறது."],
        Y: ["உங்கள் பூட்டை மட்டும் அகற்றி பிரஸ்ஸை மீண்டும் இயக்குவது", "மற்றொரு தனிமைப்படுத்தல் பதிவில் இருக்கும்போதே பிரஸ் இயங்குகிறது.", "எந்தத் தனிமைப்படுத்தல் இருந்தாலும் மீண்டும் இயக்க வேண்டாம்; மேலதிகாரியிடம் தெரிவிக்கவும்."],
        Z: ["இரண்டு பூட்டுகளையும் விட்டுவிட்டு யாரிடமும் சொல்லாமல் வீட்டுக்குச் செல்வது", "இயந்திரம் பாதுகாப்பாக உள்ளது, ஆனால் வேலை ஏன் நின்றது என்று யாருக்கும் தெரியாது.", "தனிமைப்படுத்தலை வைத்திருப்பது சரி, ஆனால் நீங்கள் தெரிவிக்கவும் வேண்டும்."],
      },
    },
  },
  { A: [false, true, false], B: [true, true, true], C: [false, false, false] },
  { W: [false, false, false], X: [true, true, true], Y: [false, true, false], Z: [true, true, false] },
);

export const KYC_SCENARIO = buildDefinition(
  {
    en: {
      situation: "A customer wants to open a savings account. The name on the address document is spelled differently from the application form.",
      rules: ["Check the original documents", "Do not open an account on unverified details", "Escalate a mismatch to the branch manager"],
      guidedPrompt: "The identity document says 'Ramesh K. Rao' but the address document says 'R. Kumar Rao'. The customer says it is the same person. What do you do?",
      hints: ["Open the 'Customer identity check before account opening' guide.", "Who decides when the documents do not match?"],
      guided: {
        A: ["Open the account because the customer confirms it", "The account is opened on unverified details.", "A spoken confirmation does not resolve a document mismatch."],
        B: ["Pause the application and escalate the mismatch to the branch manager", "The branch manager reviews the documents before anything is opened.", "Correct: the mismatch is escalated and nothing is opened on unverified details."],
        C: ["Correct the spelling on the form yourself so it matches one document", "The form no longer reflects what the customer submitted.", "Never alter an application to make documents match."],
      },
      independentPrompt: "A customer brings only a photocopy of their identity document and says the original is at home. They are in a hurry. What do you do?",
      independent: {
        W: ["Accept the photocopy and open the account", "The identity was never checked against the original.", "Do not accept a photocopy without seeing the original."],
        X: ["Ask the customer to come back with the original document", "The account is opened only after the original has been checked.", "Correct: the original is always seen before an account is opened."],
        Y: ["Accept the photocopy and note 'original to follow'", "The account exists before the identity is verified.", "A note does not replace checking the original."],
        Z: ["Ask a colleague who knows the customer to vouch for them", "Knowing someone is not a document check.", "Only the original document can be accepted."],
      },
    },
  },
  { A: [true, false, false], B: [true, true, true], C: [false, false, false] },
  { W: [false, false, false], X: [true, true, true], Y: [false, false, true], Z: [false, true, false] },
);

export const SPILL_SCENARIO = buildDefinition(
  {
    en: {
      situation: "A bottle of floor cleaner has broken in a busy aisle. The liquid is spreading.",
      rules: ["Never leave a spill unattended", "Warn customers with the wet-floor sign", "Protect your hands from chemicals"],
      guidedPrompt: "You are alone in the aisle and the spill kit is at the front of the store. What do you do?",
      hints: ["Open the 'Cleaning up a spill on the shop floor' guide.", "What happens to the next customer who walks down the aisle?"],
      guided: {
        A: ["Run to the front to fetch the spill kit yourself", "A customer slips while the spill is unattended.", "Stay with the spill and ask a colleague to bring the kit."],
        B: ["Stay by the spill, warn customers and radio a colleague to bring the kit", "Customers walk around the spill and the kit arrives in two minutes.", "Correct: the spill is guarded, customers are warned and the kit comes to you."],
        C: ["Soak up the liquid with paper towels from the shelf", "The cleaner irritates your hands and the floor is still wet.", "Wear the gloves from the spill kit; never touch chemicals with bare hands."],
      },
      independentPrompt: "The floor looks dry after mopping but it is still slippery. A customer asks you to move the sign out of the way. What do you do?",
      independent: {
        W: ["Move the sign because the floor looks dry", "The customer slips on the floor that is still slippery.", "Remove the sign only when the floor is completely dry."],
        X: ["Keep the sign in place and guide the customer around it", "The customer takes a short detour and nobody slips.", "Correct: the sign stays until the floor is completely dry."],
        Y: ["Leave to fetch a dry mop, taking the sign with you", "The slippery floor is left unmarked and unattended.", "Never leave a spill unattended or unmarked."],
        Z: ["Mop again holding the wet mop head with bare hands", "The sign stays, but your hands touch the cleaner.", "Protect your hands: wear the gloves from the spill kit."],
      },
    },
    hi: {
      situation: "भीड़ वाली गली में फ़र्श क्लीनर की एक बोतल टूट गई है। तरल फैल रहा है।",
      rules: ["गिरी हुई चीज़ को कभी बिना निगरानी के न छोड़ें", "वेट-फ़्लोर साइन से ग्राहकों को सावधान करें", "रसायनों से अपने हाथों को बचाएँ"],
      guidedPrompt: "आप गली में अकेले हैं और स्पिल किट स्टोर के आगे वाले हिस्से में है। आप क्या करेंगे?",
      hints: ["'दुकान के फ़र्श पर गिरी चीज़ साफ़ करना' गाइड खोलें।", "सोचिए, गली में आने वाले अगले ग्राहक का क्या होगा?"],
      guided: {
        A: ["ख़ुद स्पिल किट लाने के लिए आगे की ओर दौड़ना", "गिरी हुई चीज़ बिना निगरानी के रहती है और एक ग्राहक फिसल जाता है।", "गिरी हुई चीज़ के पास रहें और किसी सहकर्मी से किट मँगवाएँ।"],
        B: ["वहीं रुककर ग्राहकों को सावधान करना और रेडियो से सहकर्मी को किट लाने को कहना", "ग्राहक बचकर निकलते हैं और दो मिनट में किट आ जाती है।", "सही: जगह की निगरानी हुई, ग्राहक सावधान हुए और किट आप तक लाई गई।"],
        C: ["शेल्फ़ से पेपर टॉवल लेकर तरल सोखना", "क्लीनर से आपके हाथों में जलन होती है और फ़र्श अब भी गीला है।", "स्पिल किट के दस्ताने पहनें; रसायनों को कभी नंगे हाथों से न छुएँ।"],
      },
      independentPrompt: "पोछा लगाने के बाद फ़र्श सूखा दिखता है, पर अब भी फिसलन है। एक ग्राहक साइन हटाने को कहता है। आप क्या करेंगे?",
      independent: {
        W: ["साइन हटा देना क्योंकि फ़र्श सूखा दिखता है", "ग्राहक अब भी फिसलन वाले फ़र्श पर फिसल जाता है।", "साइन तभी हटाएँ जब फ़र्श पूरी तरह सूख जाए।"],
        X: ["साइन वहीं रखना और ग्राहक को उसके आसपास से ले जाना", "ग्राहक थोड़ा घूमकर जाता है और कोई नहीं फिसलता।", "सही: फ़र्श पूरी तरह सूखने तक साइन बना रहता है।"],
        Y: ["सूखा पोछा लाने के लिए साइन साथ लेकर चले जाना", "फिसलन वाला फ़र्श बिना निशान और बिना निगरानी के रह जाता है।", "गिरी हुई जगह को कभी बिना निगरानी या बिना निशान के न छोड़ें।"],
        Z: ["गीले पोछे का सिरा नंगे हाथों से पकड़कर फिर से पोछा लगाना", "साइन बना रहता है पर आपके हाथ क्लीनर को छूते हैं।", "अपने हाथ बचाएँ: स्पिल किट के दस्ताने पहनें।"],
      },
    },
  },
  { A: [false, false, true], B: [true, true, true], C: [true, false, false] },
  { W: [true, false, true], X: [true, true, true], Y: [false, false, true], Z: [true, true, false] },
);
