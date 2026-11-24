// Worker-facing labels in all eight languages. Used by the answer screen, slides and
// narration scripts. Demonstration wording: native-speaker review is required before real use.

import type { BlockType, Language } from "./types";

export const BLOCK_LABELS: Record<Language, Record<BlockType, string>> = {
  en: { step: "Step", warning: "Warning", prohibition: "Do not", condition: "Before you start", exception: "Exception", escalation: "Escalate", note: "Note" },
  kn: { step: "ಹಂತ", warning: "ಎಚ್ಚರಿಕೆ", prohibition: "ಮಾಡಬೇಡಿ", condition: "ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು", exception: "ವಿನಾಯಿತಿ", escalation: "ಮೇಲಧಿಕಾರಿಗೆ ತಿಳಿಸಿ", note: "ಸೂಚನೆ" },
  ta: { step: "படி", warning: "எச்சரிக்கை", prohibition: "செய்யக்கூடாது", condition: "தொடங்கும் முன்", exception: "விதிவிலக்கு", escalation: "மேலதிகாரிக்குத் தெரிவிக்கவும்", note: "குறிப்பு" },
  te: { step: "దశ", warning: "హెచ్చరిక", prohibition: "చేయవద్దు", condition: "ప్రారంభించే ముందు", exception: "మినహాయింపు", escalation: "పై అధికారికి తెలియజేయండి", note: "గమనిక" },
  hi: { step: "चरण", warning: "चेतावनी", prohibition: "ऐसा न करें", condition: "शुरू करने से पहले", exception: "अपवाद", escalation: "वरिष्ठ को सूचित करें", note: "नोट" },
  ml: { step: "ഘട്ടം", warning: "മുന്നറിയിപ്പ്", prohibition: "ചെയ്യരുത്", condition: "തുടങ്ങുന്നതിന് മുമ്പ്", exception: "ഒഴിവാക്കൽ", escalation: "മേലധികാരിയെ അറിയിക്കുക", note: "കുറിപ്പ്" },
  mr: { step: "पायरी", warning: "इशारा", prohibition: "हे करू नका", condition: "सुरू करण्यापूर्वी", exception: "अपवाद", escalation: "वरिष्ठांना कळवा", note: "टीप" },
  bn: { step: "ধাপ", warning: "সতর্কতা", prohibition: "করবেন না", condition: "শুরু করার আগে", exception: "ব্যতিক্রম", escalation: "ঊর্ধ্বতনকে জানান", note: "নোট" },
};

export interface AnswerText {
  approvedNote: string;
  escalationRoute: string;
  version: string;
  effective: string;
  source: string;
  noAnswer: string;
  needContext: string;
  notPermitted: string;
  pleaseProvide: string;
  reasons: Record<string, string>;
}

export const ANSWER_TEXT: Record<Language, AnswerText> = {
  en: {
    approvedNote: "Approved procedure — shown exactly as approved.",
    escalationRoute: "Escalation route",
    version: "Version",
    effective: "Effective",
    source: "Source",
    noAnswer: "No approved answer",
    needContext: "More context needed",
    notPermitted: "Not available to you",
    pleaseProvide: "Please provide",
    reasons: {
      no_applicable_object: "There is no approved guidance for this task and role.",
      situation_not_covered: "There is no approved guidance for this situation yet. General task steps are not shown because they may not apply. Follow your escalation route.",
      language_not_approved: "This guidance has not been approved in this language yet. Choose another language.",
      no_confident_match: "No approved guidance matched your question confidently.",
      ambiguous_match: "More than one approved item could apply.",
      several_objects_apply: "More than one approved item applies here.",
      missing_context: "More context is needed before guidance can be shown.",
      missing_task: "Choose a task or type a question.",
      role_not_permitted: "This guidance is not available to your role.",
      tenant_mismatch: "This request does not belong to your organisation.",
    },
  },
  kn: {
    approvedNote: "ಅನುಮೋದಿತ ಕಾರ್ಯವಿಧಾನ — ಅನುಮೋದಿಸಿದಂತೆಯೇ ತೋರಿಸಲಾಗಿದೆ.",
    escalationRoute: "ತಿಳಿಸುವ ಮಾರ್ಗ",
    version: "ಆವೃತ್ತಿ",
    effective: "ಜಾರಿಯಲ್ಲಿರುವುದು",
    source: "ಮೂಲ",
    noAnswer: "ಅನುಮೋದಿತ ಉತ್ತರ ಇಲ್ಲ",
    needContext: "ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಬೇಕು",
    notPermitted: "ನಿಮಗೆ ಲಭ್ಯವಿಲ್ಲ",
    pleaseProvide: "ದಯವಿಟ್ಟು ನೀಡಿ",
    reasons: {
      no_applicable_object: "ಈ ಕೆಲಸ ಮತ್ತು ಪಾತ್ರಕ್ಕೆ ಅನುಮೋದಿತ ಮಾರ್ಗದರ್ಶನ ಇಲ್ಲ.",
      situation_not_covered: "ಈ ಸನ್ನಿವೇಶಕ್ಕೆ ಇನ್ನೂ ಅನುಮೋದಿತ ಮಾರ್ಗದರ್ಶನ ಇಲ್ಲ. ಸಾಮಾನ್ಯ ಹಂತಗಳು ಅನ್ವಯಿಸದಿರಬಹುದು, ಆದ್ದರಿಂದ ತೋರಿಸಲಾಗಿಲ್ಲ. ನಿಮ್ಮ ತಿಳಿಸುವ ಮಾರ್ಗವನ್ನು ಅನುಸರಿಸಿ.",
      language_not_approved: "ಈ ಮಾರ್ಗದರ್ಶನ ಈ ಭಾಷೆಯಲ್ಲಿ ಇನ್ನೂ ಅನುಮೋದನೆಯಾಗಿಲ್ಲ. ಬೇರೆ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ.",
      no_confident_match: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಖಚಿತವಾಗಿ ಹೊಂದುವ ಅನುಮೋದಿತ ಮಾರ್ಗದರ್ಶನ ಸಿಗಲಿಲ್ಲ.",
      ambiguous_match: "ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಅನುಮೋದಿತ ವಿಷಯಗಳು ಅನ್ವಯಿಸಬಹುದು.",
      several_objects_apply: "ಇಲ್ಲಿ ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಅನುಮೋದಿತ ವಿಷಯಗಳು ಅನ್ವಯಿಸುತ್ತವೆ.",
      missing_context: "ಮಾರ್ಗದರ್ಶನ ತೋರಿಸಲು ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಬೇಕು.",
      missing_task: "ಒಂದು ಕೆಲಸವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ.",
      role_not_permitted: "ಈ ಮಾರ್ಗದರ್ಶನ ನಿಮ್ಮ ಪಾತ್ರಕ್ಕೆ ಲಭ್ಯವಿಲ್ಲ.",
      tenant_mismatch: "ಈ ವಿನಂತಿ ನಿಮ್ಮ ಸಂಸ್ಥೆಗೆ ಸೇರಿಲ್ಲ.",
    },
  },
  ta: {
    approvedNote: "அங்கீகரிக்கப்பட்ட நடைமுறை — அங்கீகரிக்கப்பட்டபடியே காட்டப்படுகிறது.",
    escalationRoute: "தெரிவிக்கும் வழி",
    version: "பதிப்பு",
    effective: "நடைமுறையில்",
    source: "மூலம்",
    noAnswer: "அங்கீகரிக்கப்பட்ட பதில் இல்லை",
    needContext: "மேலும் விவரம் தேவை",
    notPermitted: "உங்களுக்குக் கிடைக்காது",
    pleaseProvide: "தயவுசெய்து வழங்கவும்",
    reasons: {
      no_applicable_object: "இந்தப் பணிக்கும் பங்கிற்கும் அங்கீகரிக்கப்பட்ட வழிகாட்டுதல் இல்லை.",
      situation_not_covered: "இந்தச் சூழ்நிலைக்கு இன்னும் அங்கீகரிக்கப்பட்ட வழிகாட்டுதல் இல்லை. பொதுவான படிகள் பொருந்தாமல் இருக்கலாம் என்பதால் காட்டப்படவில்லை. உங்கள் தெரிவிக்கும் வழியைப் பின்பற்றவும்.",
      language_not_approved: "இந்த வழிகாட்டுதல் இந்த மொழியில் இன்னும் அங்கீகரிக்கப்படவில்லை. வேறு மொழியைத் தேர்ந்தெடுக்கவும்.",
      no_confident_match: "உங்கள் கேள்விக்கு உறுதியாகப் பொருந்தும் அங்கீகரிக்கப்பட்ட வழிகாட்டுதல் கிடைக்கவில்லை.",
      ambiguous_match: "ஒன்றுக்கு மேற்பட்ட அங்கீகரிக்கப்பட்ட உருப்படிகள் பொருந்தக்கூடும்.",
      several_objects_apply: "இங்கே ஒன்றுக்கு மேற்பட்ட அங்கீகரிக்கப்பட்ட உருப்படிகள் பொருந்துகின்றன.",
      missing_context: "வழிகாட்டுதலைக் காட்ட மேலும் விவரம் தேவை.",
      missing_task: "ஒரு பணியைத் தேர்ந்தெடுக்கவும் அல்லது கேள்வியைத் தட்டச்சு செய்யவும்.",
      role_not_permitted: "இந்த வழிகாட்டுதல் உங்கள் பங்கிற்குக் கிடைக்காது.",
      tenant_mismatch: "இந்தக் கோரிக்கை உங்கள் நிறுவனத்தைச் சேர்ந்தது அல்ல.",
    },
  },
  te: {
    approvedNote: "ఆమోదించిన విధానం — ఆమోదించినట్లే చూపబడుతోంది.",
    escalationRoute: "తెలియజేసే మార్గం",
    version: "వెర్షన్",
    effective: "అమలులో",
    source: "మూలం",
    noAnswer: "ఆమోదించిన సమాధానం లేదు",
    needContext: "మరింత సమాచారం కావాలి",
    notPermitted: "మీకు అందుబాటులో లేదు",
    pleaseProvide: "దయచేసి అందించండి",
    reasons: {
      no_applicable_object: "ఈ పని మరియు పాత్రకు ఆమోదించిన మార్గదర్శకం లేదు.",
      situation_not_covered: "ఈ పరిస్థితికి ఇంకా ఆమోదించిన మార్గదర్శకం లేదు. సాధారణ దశలు వర్తించకపోవచ్చు కాబట్టి చూపబడలేదు. మీ తెలియజేసే మార్గాన్ని అనుసరించండి.",
      language_not_approved: "ఈ మార్గదర్శకం ఈ భాషలో ఇంకా ఆమోదించబడలేదు. వేరే భాషను ఎంచుకోండి.",
      no_confident_match: "మీ ప్రశ్నకు నమ్మకంగా సరిపోయే ఆమోదించిన మార్గదర్శకం దొరకలేదు.",
      ambiguous_match: "ఒకటి కంటే ఎక్కువ ఆమోదించిన అంశాలు వర్తించవచ్చు.",
      several_objects_apply: "ఇక్కడ ఒకటి కంటే ఎక్కువ ఆమోదించిన అంశాలు వర్తిస్తాయి.",
      missing_context: "మార్గదర్శకం చూపడానికి మరింత సమాచారం కావాలి.",
      missing_task: "ఒక పనిని ఎంచుకోండి లేదా ప్రశ్నను టైప్ చేయండి.",
      role_not_permitted: "ఈ మార్గదర్శకం మీ పాత్రకు అందుబాటులో లేదు.",
      tenant_mismatch: "ఈ అభ్యర్థన మీ సంస్థకు చెందినది కాదు.",
    },
  },
  hi: {
    approvedNote: "स्वीकृत प्रक्रिया — ठीक वैसे ही दिखाई गई है जैसे स्वीकृत हुई।",
    escalationRoute: "सूचना का मार्ग",
    version: "संस्करण",
    effective: "प्रभावी",
    source: "स्रोत",
    noAnswer: "कोई स्वीकृत उत्तर नहीं",
    needContext: "और जानकारी चाहिए",
    notPermitted: "आपके लिए उपलब्ध नहीं",
    pleaseProvide: "कृपया दें",
    reasons: {
      no_applicable_object: "इस कार्य और भूमिका के लिए कोई स्वीकृत मार्गदर्शन नहीं है।",
      situation_not_covered: "इस स्थिति के लिए अभी कोई स्वीकृत मार्गदर्शन नहीं है। सामान्य चरण लागू न हों, इसलिए नहीं दिखाए गए। अपने सूचना मार्ग का पालन करें।",
      language_not_approved: "यह मार्गदर्शन इस भाषा में अभी स्वीकृत नहीं है। कोई दूसरी भाषा चुनें।",
      no_confident_match: "आपके प्रश्न से भरोसे के साथ मेल खाने वाला कोई स्वीकृत मार्गदर्शन नहीं मिला।",
      ambiguous_match: "एक से अधिक स्वीकृत विषय लागू हो सकते हैं।",
      several_objects_apply: "यहाँ एक से अधिक स्वीकृत विषय लागू होते हैं।",
      missing_context: "मार्गदर्शन दिखाने के लिए और जानकारी चाहिए।",
      missing_task: "कोई कार्य चुनें या प्रश्न टाइप करें।",
      role_not_permitted: "यह मार्गदर्शन आपकी भूमिका के लिए उपलब्ध नहीं है।",
      tenant_mismatch: "यह अनुरोध आपके संगठन का नहीं है।",
    },
  },
  ml: {
    approvedNote: "അംഗീകരിച്ച നടപടിക്രമം — അംഗീകരിച്ചതുപോലെ തന്നെ കാണിക്കുന്നു.",
    escalationRoute: "അറിയിക്കേണ്ട വഴി",
    version: "പതിപ്പ്",
    effective: "പ്രാബല്യത്തിൽ",
    source: "ഉറവിടം",
    noAnswer: "അംഗീകരിച്ച ഉത്തരമില്ല",
    needContext: "കൂടുതൽ വിവരം ആവശ്യമാണ്",
    notPermitted: "നിങ്ങൾക്ക് ലഭ്യമല്ല",
    pleaseProvide: "ദയവായി നൽകുക",
    reasons: {
      no_applicable_object: "ഈ ജോലിക്കും റോളിനും അംഗീകരിച്ച മാർഗ്ഗനിർദ്ദേശമില്ല.",
      situation_not_covered: "ഈ സാഹചര്യത്തിന് ഇതുവരെ അംഗീകരിച്ച മാർഗ്ഗനിർദ്ദേശമില്ല. പൊതുവായ ഘട്ടങ്ങൾ ബാധകമാകണമെന്നില്ലാത്തതിനാൽ കാണിക്കുന്നില്ല. നിങ്ങളുടെ അറിയിക്കേണ്ട വഴി പിന്തുടരുക.",
      language_not_approved: "ഈ മാർഗ്ഗനിർദ്ദേശം ഈ ഭാഷയിൽ ഇതുവരെ അംഗീകരിച്ചിട്ടില്ല. മറ്റൊരു ഭാഷ തിരഞ്ഞെടുക്കുക.",
      no_confident_match: "നിങ്ങളുടെ ചോദ്യത്തിന് ഉറപ്പോടെ യോജിക്കുന്ന അംഗീകരിച്ച മാർഗ്ഗനിർദ്ദേശം കണ്ടെത്തിയില്ല.",
      ambiguous_match: "ഒന്നിലധികം അംഗീകരിച്ച ഇനങ്ങൾ ബാധകമായേക്കാം.",
      several_objects_apply: "ഇവിടെ ഒന്നിലധികം അംഗീകരിച്ച ഇനങ്ങൾ ബാധകമാണ്.",
      missing_context: "മാർഗ്ഗനിർദ്ദേശം കാണിക്കാൻ കൂടുതൽ വിവരം ആവശ്യമാണ്.",
      missing_task: "ഒരു ജോലി തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ ചോദ്യം ടൈപ്പ് ചെയ്യുക.",
      role_not_permitted: "ഈ മാർഗ്ഗനിർദ്ദേശം നിങ്ങളുടെ റോളിന് ലഭ്യമല്ല.",
      tenant_mismatch: "ഈ അഭ്യർത്ഥന നിങ്ങളുടെ സ്ഥാപനത്തിന്റേതല്ല.",
    },
  },
  mr: {
    approvedNote: "मंजूर कार्यपद्धती — मंजूर झाली तशीच दाखवली आहे.",
    escalationRoute: "कळवण्याचा मार्ग",
    version: "आवृत्ती",
    effective: "लागू",
    source: "स्रोत",
    noAnswer: "मंजूर उत्तर नाही",
    needContext: "अधिक माहिती हवी",
    notPermitted: "तुमच्यासाठी उपलब्ध नाही",
    pleaseProvide: "कृपया द्या",
    reasons: {
      no_applicable_object: "या कामासाठी आणि भूमिकेसाठी मंजूर मार्गदर्शन नाही.",
      situation_not_covered: "या परिस्थितीसाठी अद्याप मंजूर मार्गदर्शन नाही. सामान्य पायऱ्या लागू नसतील म्हणून दाखवल्या नाहीत. तुमच्या कळवण्याच्या मार्गाचे पालन करा.",
      language_not_approved: "हे मार्गदर्शन या भाषेत अद्याप मंजूर नाही. दुसरी भाषा निवडा.",
      no_confident_match: "तुमच्या प्रश्नाशी खात्रीने जुळणारे मंजूर मार्गदर्शन सापडले नाही.",
      ambiguous_match: "एकापेक्षा जास्त मंजूर विषय लागू होऊ शकतात.",
      several_objects_apply: "येथे एकापेक्षा जास्त मंजूर विषय लागू होतात.",
      missing_context: "मार्गदर्शन दाखवण्यासाठी अधिक माहिती हवी.",
      missing_task: "एखादे काम निवडा किंवा प्रश्न टाइप करा.",
      role_not_permitted: "हे मार्गदर्शन तुमच्या भूमिकेसाठी उपलब्ध नाही.",
      tenant_mismatch: "ही विनंती तुमच्या संस्थेची नाही.",
    },
  },
  bn: {
    approvedNote: "অনুমোদিত পদ্ধতি — যেমন অনুমোদিত হয়েছে ঠিক তেমনই দেখানো হচ্ছে।",
    escalationRoute: "জানানোর পথ",
    version: "সংস্করণ",
    effective: "কার্যকর",
    source: "উৎস",
    noAnswer: "কোনো অনুমোদিত উত্তর নেই",
    needContext: "আরও তথ্য প্রয়োজন",
    notPermitted: "আপনার জন্য উপলব্ধ নয়",
    pleaseProvide: "অনুগ্রহ করে দিন",
    reasons: {
      no_applicable_object: "এই কাজ ও ভূমিকার জন্য কোনো অনুমোদিত নির্দেশনা নেই।",
      situation_not_covered: "এই পরিস্থিতির জন্য এখনও কোনো অনুমোদিত নির্দেশনা নেই। সাধারণ ধাপগুলি প্রযোজ্য নাও হতে পারে, তাই দেখানো হয়নি। আপনার জানানোর পথ অনুসরণ করুন।",
      language_not_approved: "এই নির্দেশনা এই ভাষায় এখনও অনুমোদিত হয়নি। অন্য ভাষা বেছে নিন।",
      no_confident_match: "আপনার প্রশ্নের সঙ্গে নিশ্চিতভাবে মেলে এমন কোনো অনুমোদিত নির্দেশনা পাওয়া যায়নি।",
      ambiguous_match: "একাধিক অনুমোদিত বিষয় প্রযোজ্য হতে পারে।",
      several_objects_apply: "এখানে একাধিক অনুমোদিত বিষয় প্রযোজ্য।",
      missing_context: "নির্দেশনা দেখাতে আরও তথ্য প্রয়োজন।",
      missing_task: "একটি কাজ বেছে নিন বা প্রশ্ন টাইপ করুন।",
      role_not_permitted: "এই নির্দেশনা আপনার ভূমিকার জন্য উপলব্ধ নয়।",
      tenant_mismatch: "এই অনুরোধ আপনার প্রতিষ্ঠানের নয়।",
    },
  },
};

/** Names of missing context fields, shown in "Please provide …". */
export const FIELD_LABELS: Record<Language, Record<string, string>> = {
  en: { asset_id: "asset or equipment model", situation_code: "situation", screen_id: "screen", workflow_state: "workflow stage", task_id: "task", query: "a more specific question" },
  kn: { asset_id: "ಆಸ್ತಿ ಅಥವಾ ಯಂತ್ರದ ಮಾದರಿ", situation_code: "ಪರಿಸ್ಥಿತಿ", screen_id: "ಪರದೆ", workflow_state: "ಕೆಲಸದ ಹಂತ", task_id: "ಕಾರ್ಯ", query: "ಹೆಚ್ಚು ನಿರ್ದಿಷ್ಟ ಪ್ರಶ್ನೆ" },
  ta: { asset_id: "சொத்து அல்லது இயந்திர மாடல்", situation_code: "சூழ்நிலை", screen_id: "திரை", workflow_state: "பணி நிலை", task_id: "பணி", query: "இன்னும் குறிப்பான கேள்வி" },
  te: { asset_id: "ఆస్తి లేదా యంత్ర మోడల్", situation_code: "పరిస్థితి", screen_id: "స్క్రీన్", workflow_state: "పని దశ", task_id: "పని", query: "మరింత నిర్దిష్టమైన ప్రశ్న" },
  hi: { asset_id: "एसेट या उपकरण मॉडल", situation_code: "स्थिति", screen_id: "स्क्रीन", workflow_state: "कार्य चरण", task_id: "कार्य", query: "अधिक स्पष्ट प्रश्न" },
  ml: { asset_id: "ആസ്തി അല്ലെങ്കിൽ ഉപകരണ മോഡൽ", situation_code: "സാഹചര്യം", screen_id: "സ്ക്രീൻ", workflow_state: "ജോലി ഘട്ടം", task_id: "ജോലി", query: "കൂടുതൽ വ്യക്തമായ ചോദ്യം" },
  mr: { asset_id: "मालमत्ता किंवा उपकरण मॉडेल", situation_code: "परिस्थिती", screen_id: "स्क्रीन", workflow_state: "कामाचा टप्पा", task_id: "काम", query: "अधिक नेमका प्रश्न" },
  bn: { asset_id: "অ্যাসেট বা যন্ত্রের মডেল", situation_code: "পরিস্থিতি", screen_id: "স্ক্রিন", workflow_state: "কাজের ধাপ", task_id: "কাজ", query: "আরও নির্দিষ্ট প্রশ্ন" },
};

/** Worker-facing screen text (Ask and Practice). */
export interface WorkerText {
  task: string;
  situation: string;
  asset: string;
  model: string;
  language: string;
  question: string;
  questionHint: string;
  none: string;
  freeText: string;
  submit: string;
  checking: string;
  media: Record<"slide" | "narration" | "source_figure" | "annotated_diagram", string>;
  downloadSlide: string;
  practiceGuided: string;
  practiceIndependent: string;
  showHint: string;
  noHints: string;
  choose: string;
  submitDecision: string;
  correct: string;
  incorrect: string;
  rules: string;
  approvedGuidance: string;
  tryAgain: string;
}

export const WORKER_TEXT: Record<Language, WorkerText> = {
  en: {
    task: "Task", situation: "Situation (optional)", asset: "Asset (optional)", model: "Equipment model (optional)", language: "Language",
    question: "Question (optional)", questionHint: "Native script, transliterated and code-mixed text work; exact codes must match", none: "— none —", freeText: "— none (free-text search) —",
    submit: "Get approved guidance", checking: "Checking…",
    media: { slide: "Instructional slide", narration: "Narrated audio", source_figure: "Approved source diagram", annotated_diagram: "Annotated diagram" },
    downloadSlide: "Download slide (.pptx)",
    practiceGuided: "Guided practice (with hints)", practiceIndependent: "Independent assessment (no hints)", showHint: "Show a hint", noHints: "No hints in the independent assessment.",
    choose: "Choose what you would do", submitDecision: "Submit decision", correct: "Correct decision", incorrect: "Not the right decision", rules: "Rules", approvedGuidance: "Approved guidance", tryAgain: "Try again",
  },
  kn: {
    task: "ಕಾರ್ಯ", situation: "ಪರಿಸ್ಥಿತಿ (ಐಚ್ಛಿಕ)", asset: "ಆಸ್ತಿ (ಐಚ್ಛಿಕ)", model: "ಯಂತ್ರದ ಮಾದರಿ (ಐಚ್ಛಿಕ)", language: "ಭಾಷೆ",
    question: "ಪ್ರಶ್ನೆ (ಐಚ್ಛಿಕ)", questionHint: "ಕನ್ನಡ ಲಿಪಿ, ಲಿಪ್ಯಂತರ ಮತ್ತು ಮಿಶ್ರ ಪಠ್ಯ ಕೆಲಸ ಮಾಡುತ್ತವೆ; ಕೋಡ್‌ಗಳು ನಿಖರವಾಗಿರಬೇಕು", none: "— ಯಾವುದೂ ಇಲ್ಲ —", freeText: "— ಯಾವುದೂ ಇಲ್ಲ (ಮುಕ್ತ ಹುಡುಕಾಟ) —",
    submit: "ಅನುಮೋದಿತ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ", checking: "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…",
    media: { slide: "ಬೋಧನಾ ಸ್ಲೈಡ್", narration: "ಧ್ವನಿ ವಿವರಣೆ", source_figure: "ಅನುಮೋದಿತ ಮೂಲ ರೇಖಾಚಿತ್ರ", annotated_diagram: "ಟಿಪ್ಪಣಿ ಸಹಿತ ರೇಖಾಚಿತ್ರ" },
    downloadSlide: "ಸ್ಲೈಡ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (.pptx)",
    practiceGuided: "ಮಾರ್ಗದರ್ಶಿತ ಅಭ್ಯಾಸ (ಸುಳಿವುಗಳೊಂದಿಗೆ)", practiceIndependent: "ಸ್ವತಂತ್ರ ಮೌಲ್ಯಮಾಪನ (ಸುಳಿವುಗಳಿಲ್ಲ)", showHint: "ಸುಳಿವು ತೋರಿಸಿ", noHints: "ಸ್ವತಂತ್ರ ಮೌಲ್ಯಮಾಪನದಲ್ಲಿ ಸುಳಿವುಗಳಿಲ್ಲ.",
    choose: "ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ ಎಂದು ಆಯ್ಕೆಮಾಡಿ", submitDecision: "ನಿರ್ಧಾರ ಸಲ್ಲಿಸಿ", correct: "ಸರಿಯಾದ ನಿರ್ಧಾರ", incorrect: "ಸರಿಯಾದ ನಿರ್ಧಾರವಲ್ಲ", rules: "ನಿಯಮಗಳು", approvedGuidance: "ಅನುಮೋದಿತ ಮಾರ್ಗದರ್ಶನ", tryAgain: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
  },
  ta: {
    task: "பணி", situation: "சூழ்நிலை (விருப்பம்)", asset: "சொத்து (விருப்பம்)", model: "இயந்திர மாடல் (விருப்பம்)", language: "மொழி",
    question: "கேள்வி (விருப்பம்)", questionHint: "தமிழ் எழுத்து, ஒலிபெயர்ப்பு மற்றும் கலப்பு உரை வேலை செய்யும்; குறியீடுகள் சரியாக இருக்க வேண்டும்", none: "— எதுவும் இல்லை —", freeText: "— எதுவும் இல்லை (இலவச தேடல்) —",
    submit: "அங்கீகரிக்கப்பட்ட வழிகாட்டலைப் பெறுக", checking: "சரிபார்க்கிறது…",
    media: { slide: "பயிற்சி ஸ்லைடு", narration: "குரல் விளக்கம்", source_figure: "அங்கீகரிக்கப்பட்ட மூல வரைபடம்", annotated_diagram: "குறிப்புகளுடன் வரைபடம்" },
    downloadSlide: "ஸ்லைடைப் பதிவிறக்கவும் (.pptx)",
    practiceGuided: "வழிகாட்டப்பட்ட பயிற்சி (குறிப்புகளுடன்)", practiceIndependent: "சுயாதீன மதிப்பீடு (குறிப்புகள் இல்லை)", showHint: "குறிப்பைக் காட்டு", noHints: "சுயாதீன மதிப்பீட்டில் குறிப்புகள் இல்லை.",
    choose: "நீங்கள் என்ன செய்வீர்கள் என்பதைத் தேர்ந்தெடுக்கவும்", submitDecision: "முடிவைச் சமர்ப்பிக்கவும்", correct: "சரியான முடிவு", incorrect: "சரியான முடிவு அல்ல", rules: "விதிகள்", approvedGuidance: "அங்கீகரிக்கப்பட்ட வழிகாட்டல்", tryAgain: "மீண்டும் முயற்சிக்கவும்",
  },
  te: {
    task: "పని", situation: "పరిస్థితి (ఐచ్ఛికం)", asset: "ఆస్తి (ఐచ్ఛికం)", model: "యంత్ర మోడల్ (ఐచ్ఛికం)", language: "భాష",
    question: "ప్రశ్న (ఐచ్ఛికం)", questionHint: "తెలుగు లిపి, లిప్యంతరీకరణ మరియు మిశ్రమ వచనం పనిచేస్తాయి; కోడ్‌లు ఖచ్చితంగా ఉండాలి", none: "— ఏదీ లేదు —", freeText: "— ఏదీ లేదు (ఉచిత శోధన) —",
    submit: "ఆమోదించిన మార్గదర్శనం పొందండి", checking: "తనిఖీ చేస్తోంది…",
    media: { slide: "బోధనా స్లైడ్", narration: "వాయిస్ వివరణ", source_figure: "ఆమోదించిన మూల చిత్రం", annotated_diagram: "వివరణలతో కూడిన చిత్రం" },
    downloadSlide: "స్లైడ్ డౌన్‌లోడ్ చేయండి (.pptx)",
    practiceGuided: "మార్గదర్శక అభ్యాసం (సూచనలతో)", practiceIndependent: "స్వతంత్ర మూల్యాంకనం (సూచనలు లేవు)", showHint: "సూచన చూపించు", noHints: "స్వతంత్ర మూల్యాంకనంలో సూచనలు లేవు.",
    choose: "మీరు ఏమి చేస్తారో ఎంచుకోండి", submitDecision: "నిర్ణయాన్ని సమర్పించండి", correct: "సరైన నిర్ణయం", incorrect: "సరైన నిర్ణయం కాదు", rules: "నియమాలు", approvedGuidance: "ఆమోదించిన మార్గదర్శనం", tryAgain: "మళ్లీ ప్రయత్నించండి",
  },
  hi: {
    task: "कार्य", situation: "स्थिति (वैकल्पिक)", asset: "एसेट (वैकल्पिक)", model: "उपकरण मॉडल (वैकल्पिक)", language: "भाषा",
    question: "प्रश्न (वैकल्पिक)", questionHint: "देवनागरी, लिप्यंतरित और मिश्रित पाठ काम करते हैं; कोड बिल्कुल सही होने चाहिए", none: "— कोई नहीं —", freeText: "— कोई नहीं (मुक्त खोज) —",
    submit: "स्वीकृत मार्गदर्शन पाएँ", checking: "जाँच हो रही है…",
    media: { slide: "प्रशिक्षण स्लाइड", narration: "ऑडियो विवरण", source_figure: "स्वीकृत मूल चित्र", annotated_diagram: "टिप्पणी सहित चित्र" },
    downloadSlide: "स्लाइड डाउनलोड करें (.pptx)",
    practiceGuided: "मार्गदर्शित अभ्यास (संकेतों के साथ)", practiceIndependent: "स्वतंत्र मूल्यांकन (कोई संकेत नहीं)", showHint: "संकेत दिखाएँ", noHints: "स्वतंत्र मूल्यांकन में कोई संकेत नहीं है।",
    choose: "चुनें कि आप क्या करेंगे", submitDecision: "निर्णय जमा करें", correct: "सही निर्णय", incorrect: "सही निर्णय नहीं", rules: "नियम", approvedGuidance: "स्वीकृत मार्गदर्शन", tryAgain: "फिर से प्रयास करें",
  },
  ml: {
    task: "ജോലി", situation: "സാഹചര്യം (ഐച്ഛികം)", asset: "ആസ്തി (ഐച്ഛികം)", model: "ഉപകരണ മോഡൽ (ഐച്ഛികം)", language: "ഭാഷ",
    question: "ചോദ്യം (ഐച്ഛികം)", questionHint: "മലയാളം ലിപി, ലിപ്യന്തരണം, കലർന്ന വാചകം എന്നിവ പ്രവർത്തിക്കും; കോഡുകൾ കൃത്യമായിരിക്കണം", none: "— ഒന്നുമില്ല —", freeText: "— ഒന്നുമില്ല (സ്വതന്ത്ര തിരയൽ) —",
    submit: "അംഗീകൃത മാർഗ്ഗനിർദ്ദേശം നേടുക", checking: "പരിശോധിക്കുന്നു…",
    media: { slide: "പരിശീലന സ്ലൈഡ്", narration: "ശബ്ദ വിവരണം", source_figure: "അംഗീകൃത ഉറവിട ചിത്രം", annotated_diagram: "കുറിപ്പുകളുള്ള ചിത്രം" },
    downloadSlide: "സ്ലൈഡ് ഡൗൺലോഡ് ചെയ്യുക (.pptx)",
    practiceGuided: "മാർഗ്ഗനിർദ്ദേശിത പരിശീലനം (സൂചനകളോടെ)", practiceIndependent: "സ്വതന്ത്ര വിലയിരുത്തൽ (സൂചനകളില്ല)", showHint: "സൂചന കാണിക്കുക", noHints: "സ്വതന്ത്ര വിലയിരുത്തലിൽ സൂചനകളില്ല.",
    choose: "നിങ്ങൾ എന്ത് ചെയ്യുമെന്ന് തിരഞ്ഞെടുക്കുക", submitDecision: "തീരുമാനം സമർപ്പിക്കുക", correct: "ശരിയായ തീരുമാനം", incorrect: "ശരിയായ തീരുമാനമല്ല", rules: "നിയമങ്ങൾ", approvedGuidance: "അംഗീകൃത മാർഗ്ഗനിർദ്ദേശം", tryAgain: "വീണ്ടും ശ്രമിക്കുക",
  },
  mr: {
    task: "काम", situation: "परिस्थिती (ऐच्छिक)", asset: "मालमत्ता (ऐच्छिक)", model: "उपकरण मॉडेल (ऐच्छिक)", language: "भाषा",
    question: "प्रश्न (ऐच्छिक)", questionHint: "देवनागरी, लिप्यंतरित आणि मिश्र मजकूर चालतो; कोड अचूक असावेत", none: "— काहीही नाही —", freeText: "— काहीही नाही (मुक्त शोध) —",
    submit: "मंजूर मार्गदर्शन मिळवा", checking: "तपासत आहे…",
    media: { slide: "प्रशिक्षण स्लाइड", narration: "ऑडिओ निवेदन", source_figure: "मंजूर मूळ आकृती", annotated_diagram: "टिपांसह आकृती" },
    downloadSlide: "स्लाइड डाउनलोड करा (.pptx)",
    practiceGuided: "मार्गदर्शित सराव (संकेतांसह)", practiceIndependent: "स्वतंत्र मूल्यमापन (संकेत नाहीत)", showHint: "संकेत दाखवा", noHints: "स्वतंत्र मूल्यमापनात संकेत नाहीत.",
    choose: "तुम्ही काय कराल ते निवडा", submitDecision: "निर्णय सादर करा", correct: "योग्य निर्णय", incorrect: "योग्य निर्णय नाही", rules: "नियम", approvedGuidance: "मंजूर मार्गदर्शन", tryAgain: "पुन्हा प्रयत्न करा",
  },
  bn: {
    task: "কাজ", situation: "পরিস্থিতি (ঐচ্ছিক)", asset: "অ্যাসেট (ঐচ্ছিক)", model: "যন্ত্রের মডেল (ঐচ্ছিক)", language: "ভাষা",
    question: "প্রশ্ন (ঐচ্ছিক)", questionHint: "বাংলা লিপি, প্রতিবর্ণীকৃত ও মিশ্র লেখা কাজ করে; কোড হুবহু মিলতে হবে", none: "— কোনোটি নয় —", freeText: "— কোনোটি নয় (মুক্ত অনুসন্ধান) —",
    submit: "অনুমোদিত নির্দেশনা পান", checking: "যাচাই করা হচ্ছে…",
    media: { slide: "প্রশিক্ষণ স্লাইড", narration: "অডিও বর্ণনা", source_figure: "অনুমোদিত মূল চিত্র", annotated_diagram: "টীকাসহ চিত্র" },
    downloadSlide: "স্লাইড ডাউনলোড করুন (.pptx)",
    practiceGuided: "নির্দেশিত অনুশীলন (ইঙ্গিতসহ)", practiceIndependent: "স্বাধীন মূল্যায়ন (ইঙ্গিত নেই)", showHint: "ইঙ্গিত দেখান", noHints: "স্বাধীন মূল্যায়নে কোনো ইঙ্গিত নেই।",
    choose: "আপনি কী করবেন বেছে নিন", submitDecision: "সিদ্ধান্ত জমা দিন", correct: "সঠিক সিদ্ধান্ত", incorrect: "সঠিক সিদ্ধান্ত নয়", rules: "নিয়ম", approvedGuidance: "অনুমোদিত নির্দেশনা", tryAgain: "আবার চেষ্টা করুন",
  },
};

export const FONT_FOR: Record<Language, string> = {
  en: "Noto Sans",
  kn: "Noto Sans Kannada",
  ta: "Noto Sans Tamil",
  te: "Noto Sans Telugu",
  hi: "Noto Sans Devanagari",
  mr: "Noto Sans Devanagari",
  ml: "Noto Sans Malayalam",
  bn: "Noto Sans Bengali",
};
