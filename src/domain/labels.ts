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

/** Names of tasks, situations and equipment as workers see them. Codes stay unchanged. */
export const CONTEXT_LABELS: Record<Language, Record<string, string>> = {
  en: { "T-PICKUP": "Parcel pickup", "T-COD-REVIEW": "Cash-on-delivery review", "T-CONV-INSPECT": "Conveyor daily inspection", "T-RETURNS": "Customer return collection", DAMAGED_PACKAGE: "Damaged packaging", ADDRESS_MISMATCH: "Address mismatch", LEAKING_CONTENTS: "Leaking contents", "EQ-1000-A": "Conveyor line A", "EQ-1000-B": "Conveyor line B", "EQ-2000-X": "Sorter X", "CV-1000": "Conveyor model CV-1000" , "T-LOTO": "Lockout and tagout", "T-FORKLIFT-CHECK": "Forklift pre-use check", "T-CASH-OPEN": "Opening the cash counter", "T-KYC-CHECK": "Customer identity check", "T-SUSPICIOUS-TXN": "Suspicious transaction", "T-SPILL": "Spill on the shop floor", "T-FIRE-CHECK": "Fire exit and extinguisher check", "T-CUSTOMER-INJURY": "Customer injury", "FL-25-01": "Forklift FL-25-01", "FL-25-02": "Forklift FL-25-02", "FL-25": "Forklift model FL-25"},
  kn: { "T-PICKUP": "ಪಾರ್ಸೆಲ್ ಪಿಕಪ್", "T-COD-REVIEW": "ಕ್ಯಾಶ್-ಆನ್-ಡೆಲಿವರಿ ಪರಿಶೀಲನೆ", "T-CONV-INSPECT": "ಕನ್ವೇಯರ್ ದೈನಂದಿನ ತಪಾಸಣೆ", "T-RETURNS": "ಗ್ರಾಹಕ ರಿಟರ್ನ್ ಸಂಗ್ರಹ", DAMAGED_PACKAGE: "ಹಾನಿಗೊಳಗಾದ ಪ್ಯಾಕೇಜಿಂಗ್", ADDRESS_MISMATCH: "ವಿಳಾಸ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ", LEAKING_CONTENTS: "ಸೋರುತ್ತಿರುವ ವಸ್ತುಗಳು", "EQ-1000-A": "ಕನ್ವೇಯರ್ ಲೈನ್ A", "EQ-1000-B": "ಕನ್ವೇಯರ್ ಲೈನ್ B", "EQ-2000-X": "ಸಾರ್ಟರ್ X", "CV-1000": "ಕನ್ವೇಯರ್ ಮಾದರಿ CV-1000" , "T-LOTO": "ಲಾಕ್‌ಔಟ್ ಮತ್ತು ಟ್ಯಾಗ್‌ಔಟ್", "T-FORKLIFT-CHECK": "ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ ಬಳಕೆಗೆ ಮುನ್ನ ತಪಾಸಣೆ", "T-CASH-OPEN": "ನಗದು ಕೌಂಟರ್ ತೆರೆಯುವುದು", "T-KYC-CHECK": "ಗ್ರಾಹಕರ ಗುರುತಿನ ಪರಿಶೀಲನೆ", "T-SUSPICIOUS-TXN": "ಅನುಮಾನಾಸ್ಪದ ವಹಿವಾಟು", "T-SPILL": "ಅಂಗಡಿ ನೆಲದ ಮೇಲೆ ಚೆಲ್ಲಿದ್ದು", "T-FIRE-CHECK": "ಅಗ್ನಿ ನಿರ್ಗಮನ ಮತ್ತು ಅಗ್ನಿಶಾಮಕ ತಪಾಸಣೆ", "T-CUSTOMER-INJURY": "ಗ್ರಾಹಕರಿಗೆ ಗಾಯ", "FL-25-01": "ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ FL-25-01", "FL-25-02": "ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ FL-25-02", "FL-25": "ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ ಮಾದರಿ FL-25"},
  ta: { "T-PICKUP": "பார்சல் பிக்அப்", "T-COD-REVIEW": "கேஷ்-ஆன்-டெலிவரி சரிபார்ப்பு", "T-CONV-INSPECT": "கன்வேயர் தினசரி ஆய்வு", "T-RETURNS": "வாடிக்கையாளர் ரிட்டர்ன் சேகரிப்பு", DAMAGED_PACKAGE: "சேதமடைந்த பேக்கேஜிங்", ADDRESS_MISMATCH: "முகவரி பொருந்தவில்லை", LEAKING_CONTENTS: "கசியும் பொருட்கள்", "EQ-1000-A": "கன்வேயர் லைன் A", "EQ-1000-B": "கன்வேயர் லைன் B", "EQ-2000-X": "சார்ட்டர் X", "CV-1000": "கன்வேயர் மாடல் CV-1000" , "T-LOTO": "லாக்அவுட் மற்றும் டேக்அவுட்", "T-FORKLIFT-CHECK": "ஃபோர்க்லிஃப்ட் பயன்பாட்டுக்கு முன் சோதனை", "T-CASH-OPEN": "பணக் கவுண்டரைத் திறத்தல்", "T-KYC-CHECK": "வாடிக்கையாளர் அடையாளச் சரிபார்ப்பு", "T-SUSPICIOUS-TXN": "சந்தேகத்திற்குரிய பரிவர்த்தனை", "T-SPILL": "கடைத் தரையில் சிந்தியது", "T-FIRE-CHECK": "தீ வெளியேற்றம் மற்றும் தீயணைப்பான் சோதனை", "T-CUSTOMER-INJURY": "வாடிக்கையாளர் காயம்", "FL-25-01": "ஃபோர்க்லிஃப்ட் FL-25-01", "FL-25-02": "ஃபோர்க்லிஃப்ட் FL-25-02", "FL-25": "ஃபோர்க்லிஃப்ட் மாடல் FL-25"},
  te: { "T-PICKUP": "పార్సెల్ పికప్", "T-COD-REVIEW": "క్యాష్-ఆన్-డెలివరీ సమీక్ష", "T-CONV-INSPECT": "కన్వేయర్ రోజువారీ తనిఖీ", "T-RETURNS": "కస్టమర్ రిటర్న్ సేకరణ", DAMAGED_PACKAGE: "దెబ్బతిన్న ప్యాకేజింగ్", ADDRESS_MISMATCH: "చిరునామా సరిపోలడం లేదు", LEAKING_CONTENTS: "కారుతున్న వస్తువులు", "EQ-1000-A": "కన్వేయర్ లైన్ A", "EQ-1000-B": "కన్వేయర్ లైన్ B", "EQ-2000-X": "సార్టర్ X", "CV-1000": "కన్వేయర్ మోడల్ CV-1000" , "T-LOTO": "లాకౌట్ మరియు ట్యాగౌట్", "T-FORKLIFT-CHECK": "ఫోర్క్‌లిఫ్ట్ వినియోగానికి ముందు తనిఖీ", "T-CASH-OPEN": "నగదు కౌంటర్ తెరవడం", "T-KYC-CHECK": "కస్టమర్ గుర్తింపు తనిఖీ", "T-SUSPICIOUS-TXN": "అనుమానాస్పద లావాదేవీ", "T-SPILL": "దుకాణం నేలపై ఒలికినది", "T-FIRE-CHECK": "ఫైర్ ఎగ్జిట్ మరియు అగ్నిమాపక తనిఖీ", "T-CUSTOMER-INJURY": "కస్టమర్ గాయం", "FL-25-01": "ఫోర్క్‌లిఫ్ట్ FL-25-01", "FL-25-02": "ఫోర్క్‌లిఫ్ట్ FL-25-02", "FL-25": "ఫోర్క్‌లిఫ్ట్ మోడల్ FL-25"},
  hi: { "T-PICKUP": "पार्सल पिकअप", "T-COD-REVIEW": "कैश-ऑन-डिलीवरी समीक्षा", "T-CONV-INSPECT": "कन्वेयर दैनिक निरीक्षण", "T-RETURNS": "ग्राहक रिटर्न संग्रह", DAMAGED_PACKAGE: "क्षतिग्रस्त पैकेजिंग", ADDRESS_MISMATCH: "पता मेल नहीं खाता", LEAKING_CONTENTS: "रिसता हुआ सामान", "EQ-1000-A": "कन्वेयर लाइन A", "EQ-1000-B": "कन्वेयर लाइन B", "EQ-2000-X": "सॉर्टर X", "CV-1000": "कन्वेयर मॉडल CV-1000" , "T-LOTO": "लॉकआउट और टैगआउट", "T-FORKLIFT-CHECK": "फोर्कलिफ्ट उपयोग से पहले जाँच", "T-CASH-OPEN": "नकद काउंटर खोलना", "T-KYC-CHECK": "ग्राहक पहचान जाँच", "T-SUSPICIOUS-TXN": "संदिग्ध लेनदेन", "T-SPILL": "फ़र्श पर गिरी चीज़", "T-FIRE-CHECK": "फ़ायर एग्ज़िट और अग्निशामक जाँच", "T-CUSTOMER-INJURY": "ग्राहक को चोट", "FL-25-01": "फोर्कलिफ्ट FL-25-01", "FL-25-02": "फोर्कलिफ्ट FL-25-02", "FL-25": "फोर्कलिफ्ट मॉडल FL-25"},
  ml: { "T-PICKUP": "പാഴ്സൽ പിക്കപ്പ്", "T-COD-REVIEW": "ക്യാഷ്-ഓൺ-ഡെലിവറി പരിശോധന", "T-CONV-INSPECT": "കൺവെയർ ദൈനംദിന പരിശോധന", "T-RETURNS": "ഉപഭോക്തൃ റിട്ടേൺ ശേഖരണം", DAMAGED_PACKAGE: "കേടായ പാക്കേജിംഗ്", ADDRESS_MISMATCH: "വിലാസം പൊരുത്തപ്പെടുന്നില്ല", LEAKING_CONTENTS: "ചോരുന്ന വസ്തുക്കൾ", "EQ-1000-A": "കൺവെയർ ലൈൻ A", "EQ-1000-B": "കൺവെയർ ലൈൻ B", "EQ-2000-X": "സോർട്ടർ X", "CV-1000": "കൺവെയർ മോഡൽ CV-1000" , "T-LOTO": "ലോക്കൗട്ടും ടാഗൗട്ടും", "T-FORKLIFT-CHECK": "ഫോർക്ക്‌ലിഫ്റ്റ് ഉപയോഗത്തിന് മുമ്പുള്ള പരിശോധന", "T-CASH-OPEN": "ക്യാഷ് കൗണ്ടർ തുറക്കൽ", "T-KYC-CHECK": "ഉപഭോക്തൃ തിരിച്ചറിയൽ പരിശോധന", "T-SUSPICIOUS-TXN": "സംശയാസ്പദമായ ഇടപാട്", "T-SPILL": "കടയുടെ തറയിൽ തൂവിയത്", "T-FIRE-CHECK": "ഫയർ എക്സിറ്റും അഗ്നിശമന ഉപകരണ പരിശോധനയും", "T-CUSTOMER-INJURY": "ഉപഭോക്താവിന് പരിക്ക്", "FL-25-01": "ഫോർക്ക്‌ലിഫ്റ്റ് FL-25-01", "FL-25-02": "ഫോർക്ക്‌ലിഫ്റ്റ് FL-25-02", "FL-25": "ഫോർക്ക്‌ലിഫ്റ്റ് മോഡൽ FL-25"},
  mr: { "T-PICKUP": "पार्सल पिकअप", "T-COD-REVIEW": "कॅश-ऑन-डिलिव्हरी पुनरावलोकन", "T-CONV-INSPECT": "कन्व्हेयर दैनंदिन तपासणी", "T-RETURNS": "ग्राहक रिटर्न संकलन", DAMAGED_PACKAGE: "खराब झालेले पॅकेजिंग", ADDRESS_MISMATCH: "पत्ता जुळत नाही", LEAKING_CONTENTS: "गळणाऱ्या वस्तू", "EQ-1000-A": "कन्व्हेयर लाइन A", "EQ-1000-B": "कन्व्हेयर लाइन B", "EQ-2000-X": "सॉर्टर X", "CV-1000": "कन्व्हेयर मॉडेल CV-1000" , "T-LOTO": "लॉकआउट आणि टॅगआउट", "T-FORKLIFT-CHECK": "फोर्कलिफ्ट वापरापूर्वी तपासणी", "T-CASH-OPEN": "रोख काउंटर उघडणे", "T-KYC-CHECK": "ग्राहक ओळख तपासणी", "T-SUSPICIOUS-TXN": "संशयास्पद व्यवहार", "T-SPILL": "जमिनीवर सांडलेले", "T-FIRE-CHECK": "फायर एक्झिट आणि अग्निशामक तपासणी", "T-CUSTOMER-INJURY": "ग्राहकाला दुखापत", "FL-25-01": "फोर्कलिफ्ट FL-25-01", "FL-25-02": "फोर्कलिफ्ट FL-25-02", "FL-25": "फोर्कलिफ्ट मॉडेल FL-25"},
  bn: { "T-PICKUP": "পার্সেল পিকআপ", "T-COD-REVIEW": "ক্যাশ-অন-ডেলিভারি পর্যালোচনা", "T-CONV-INSPECT": "কনভেয়ার দৈনিক পরিদর্শন", "T-RETURNS": "গ্রাহক রিটার্ন সংগ্রহ", DAMAGED_PACKAGE: "ক্ষতিগ্রস্ত প্যাকেজিং", ADDRESS_MISMATCH: "ঠিকানা মিলছে না", LEAKING_CONTENTS: "চুইয়ে পড়া জিনিস", "EQ-1000-A": "কনভেয়ার লাইন A", "EQ-1000-B": "কনভেয়ার লাইন B", "EQ-2000-X": "সর্টার X", "CV-1000": "কনভেয়ার মডেল CV-1000" , "T-LOTO": "লকআউট ও ট্যাগআউট", "T-FORKLIFT-CHECK": "ফর্কলিফট ব্যবহারের আগে পরীক্ষা", "T-CASH-OPEN": "নগদ কাউন্টার খোলা", "T-KYC-CHECK": "গ্রাহকের পরিচয় যাচাই", "T-SUSPICIOUS-TXN": "সন্দেহজনক লেনদেন", "T-SPILL": "মেঝেতে পড়ে যাওয়া জিনিস", "T-FIRE-CHECK": "ফায়ার এক্সিট ও অগ্নিনির্বাপক পরীক্ষা", "T-CUSTOMER-INJURY": "গ্রাহকের আঘাত", "FL-25-01": "ফর্কলিফট FL-25-01", "FL-25-02": "ফর্কলিফট FL-25-02", "FL-25": "ফর্কলিফট মডেল FL-25"},
};

/** Field-app screen text. */
export interface WorkerText {
  hello: string;
  chooseTask: string;
  searchPlaceholder: string;
  search: string;
  guidance: string;
  practice: string;
  situationQuestion: string;
  normal: string;
  whichEquipment: string;
  back: string;
  language: string;
  noTasks: string;
  switchUser: string;
  practiceIntro: string;
  guided: string;
  guidedHint: string;
  independent: string;
  independentHint: string;
  showHint: string;
  choose: string;
  submitDecision: string;
  correct: string;
  incorrect: string;
  rules: string;
  approvedGuidance: string;
  tryAgain: string;
  media: Record<"slide" | "narration" | "source_figure" | "annotated_diagram", string>;
  downloadSlide: string;
  myCourse: string;
  courseIntro: string;
  module: string;
  min: string;
  openGuide: string;
  guideComing: string;
  inLms: string;
  notInLanguage: string;
  showIn: string;
}

export const WORKER_TEXT: Record<Language, WorkerText> = {
  en: {
    hello: "Hello", chooseTask: "What are you working on?", searchPlaceholder: "Describe the problem in your own words", search: "Search",
    guidance: "Guidance", practice: "Practice", situationQuestion: "Is anything unusual?", normal: "No, normal job", whichEquipment: "Which equipment?",
    back: "Back", language: "Language", noTasks: "No tasks are set up for your role yet.", switchUser: "Switch user",
    practiceIntro: "Practise real decisions before they happen on the job.", guided: "Guided practice", guidedHint: "With hints and feedback",
    independent: "Independent check", independentHint: "A new situation, no hints", showHint: "Show a hint", choose: "What would you do?",
    submitDecision: "Submit decision", correct: "Correct decision", incorrect: "Not the right decision", rules: "What was checked",
    approvedGuidance: "The approved procedure", tryAgain: "Try again",
    media: { slide: "Slide", narration: "Audio", source_figure: "Diagram", annotated_diagram: "Labelled diagram" },
    downloadSlide: "Download slide",
    myCourse: "My course", courseIntro: "Your company's e-learning modules, with the approved guides to use on the job.", module: "Module", min: "min", openGuide: "Open guide", guideComing: "Guide being prepared", inLms: "Lesson in your learning platform", notInLanguage: "Not yet approved in your language.", showIn: "Show in",
  },
  kn: {
    hello: "ನಮಸ್ಕಾರ", chooseTask: "ನೀವು ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ?", searchPlaceholder: "ಸಮಸ್ಯೆಯನ್ನು ನಿಮ್ಮ ಮಾತುಗಳಲ್ಲಿ ವಿವರಿಸಿ", search: "ಹುಡುಕಿ",
    guidance: "ಮಾರ್ಗದರ್ಶನ", practice: "ಅಭ್ಯಾಸ", situationQuestion: "ಏನಾದರೂ ಅಸಾಮಾನ್ಯವಿದೆಯೇ?", normal: "ಇಲ್ಲ, ಸಾಮಾನ್ಯ ಕೆಲಸ", whichEquipment: "ಯಾವ ಉಪಕರಣ?",
    back: "ಹಿಂದೆ", language: "ಭಾಷೆ", noTasks: "ನಿಮ್ಮ ಪಾತ್ರಕ್ಕೆ ಇನ್ನೂ ಯಾವುದೇ ಕೆಲಸಗಳನ್ನು ಹೊಂದಿಸಲಾಗಿಲ್ಲ.", switchUser: "ಬಳಕೆದಾರ ಬದಲಿಸಿ",
    practiceIntro: "ಕೆಲಸದಲ್ಲಿ ಎದುರಾಗುವ ಮೊದಲೇ ನಿಜವಾದ ನಿರ್ಧಾರಗಳನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ.", guided: "ಮಾರ್ಗದರ್ಶಿತ ಅಭ್ಯಾಸ", guidedHint: "ಸುಳಿವು ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆಯೊಂದಿಗೆ",
    independent: "ಸ್ವತಂತ್ರ ಪರೀಕ್ಷೆ", independentHint: "ಹೊಸ ಸನ್ನಿವೇಶ, ಸುಳಿವು ಇಲ್ಲ", showHint: "ಸುಳಿವು ತೋರಿಸಿ", choose: "ನೀವು ಏನು ಮಾಡುತ್ತೀರಿ?",
    submitDecision: "ನಿರ್ಧಾರ ಸಲ್ಲಿಸಿ", correct: "ಸರಿಯಾದ ನಿರ್ಧಾರ", incorrect: "ಸರಿಯಾದ ನಿರ್ಧಾರವಲ್ಲ", rules: "ಏನನ್ನು ಪರಿಶೀಲಿಸಲಾಯಿತು",
    approvedGuidance: "ಅನುಮೋದಿತ ಕಾರ್ಯವಿಧಾನ", tryAgain: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    media: { slide: "ಸ್ಲೈಡ್", narration: "ಆಡಿಯೋ", source_figure: "ರೇಖಾಚಿತ್ರ", annotated_diagram: "ಲೇಬಲ್ ಸಹಿತ ರೇಖಾಚಿತ್ರ" },
    downloadSlide: "ಸ್ಲೈಡ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    myCourse: "ನನ್ನ ಕೋರ್ಸ್", courseIntro: "ನಿಮ್ಮ ಕಂಪನಿಯ ಇ-ಲರ್ನಿಂಗ್ ಮಾಡ್ಯೂಲ್‌ಗಳು ಮತ್ತು ಕೆಲಸದಲ್ಲಿ ಬಳಸಲು ಅನುಮೋದಿತ ಮಾರ್ಗದರ್ಶಿಗಳು.", module: "ಮಾಡ್ಯೂಲ್", min: "ನಿಮಿಷ", openGuide: "ಮಾರ್ಗದರ್ಶಿ ತೆರೆಯಿರಿ", guideComing: "ಮಾರ್ಗದರ್ಶಿ ಸಿದ್ಧವಾಗುತ್ತಿದೆ", inLms: "ಪಾಠ ನಿಮ್ಮ ಕಲಿಕಾ ವೇದಿಕೆಯಲ್ಲಿ", notInLanguage: "ಇದು ಇನ್ನೂ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಅನುಮೋದನೆಯಾಗಿಲ್ಲ.", showIn: "ಇದರಲ್ಲಿ ನೋಡಿ",
  },
  ta: {
    hello: "வணக்கம்", chooseTask: "நீங்கள் எந்த வேலையில் இருக்கிறீர்கள்?", searchPlaceholder: "பிரச்சினையை உங்கள் சொந்த வார்த்தைகளில் விவரிக்கவும்", search: "தேடு",
    guidance: "வழிகாட்டல்", practice: "பயிற்சி", situationQuestion: "ஏதாவது வழக்கத்திற்கு மாறாக உள்ளதா?", normal: "இல்லை, வழக்கமான வேலை", whichEquipment: "எந்த இயந்திரம்?",
    back: "பின்செல்", language: "மொழி", noTasks: "உங்கள் பணிக்கு இன்னும் எந்தப் பணிகளும் அமைக்கப்படவில்லை.", switchUser: "பயனரை மாற்று",
    practiceIntro: "வேலையில் நிகழும் முன்பே உண்மையான முடிவுகளைப் பயிற்சி செய்யுங்கள்.", guided: "வழிகாட்டப்பட்ட பயிற்சி", guidedHint: "குறிப்புகள் மற்றும் கருத்துகளுடன்",
    independent: "சுயாதீன சோதனை", independentHint: "புதிய சூழ்நிலை, குறிப்புகள் இல்லை", showHint: "குறிப்பைக் காட்டு", choose: "நீங்கள் என்ன செய்வீர்கள்?",
    submitDecision: "முடிவைச் சமர்ப்பிக்கவும்", correct: "சரியான முடிவு", incorrect: "சரியான முடிவு அல்ல", rules: "எவை சரிபார்க்கப்பட்டன",
    approvedGuidance: "அங்கீகரிக்கப்பட்ட நடைமுறை", tryAgain: "மீண்டும் முயற்சிக்கவும்",
    media: { slide: "ஸ்லைடு", narration: "ஒலி", source_figure: "வரைபடம்", annotated_diagram: "குறிப்புகளுடன் வரைபடம்" },
    downloadSlide: "ஸ்லைடைப் பதிவிறக்கு",
    myCourse: "என் பாடநெறி", courseIntro: "உங்கள் நிறுவனத்தின் இ-லேர்னிங் தொகுதிகள், வேலையில் பயன்படுத்த அங்கீகரிக்கப்பட்ட வழிகாட்டிகளுடன்.", module: "தொகுதி", min: "நிமி", openGuide: "வழிகாட்டியைத் திற", guideComing: "வழிகாட்டி தயாராகிறது", inLms: "பாடம் உங்கள் கற்றல் தளத்தில்", notInLanguage: "இது இன்னும் உங்கள் மொழியில் அங்கீகரிக்கப்படவில்லை.", showIn: "இதில் காண்க",
  },
  te: {
    hello: "నమస్కారం", chooseTask: "మీరు ఏ పని చేస్తున్నారు?", searchPlaceholder: "సమస్యను మీ మాటల్లో వివరించండి", search: "వెతకండి",
    guidance: "మార్గదర్శనం", practice: "అభ్యాసం", situationQuestion: "ఏదైనా అసాధారణంగా ఉందా?", normal: "లేదు, సాధారణ పని", whichEquipment: "ఏ యంత్రం?",
    back: "వెనుకకు", language: "భాష", noTasks: "మీ పాత్రకు ఇంకా ఏ పనులూ సెట్ చేయలేదు.", switchUser: "వినియోగదారుని మార్చండి",
    practiceIntro: "పనిలో ఎదురయ్యే ముందే నిజమైన నిర్ణయాలను అభ్యాసం చేయండి.", guided: "మార్గదర్శక అభ్యాసం", guidedHint: "సూచనలు మరియు అభిప్రాయంతో",
    independent: "స్వతంత్ర పరీక్ష", independentHint: "కొత్త పరిస్థితి, సూచనలు లేవు", showHint: "సూచన చూపించు", choose: "మీరు ఏమి చేస్తారు?",
    submitDecision: "నిర్ణయాన్ని సమర్పించండి", correct: "సరైన నిర్ణయం", incorrect: "సరైన నిర్ణయం కాదు", rules: "ఏమి పరిశీలించారు",
    approvedGuidance: "ఆమోదించిన విధానం", tryAgain: "మళ్లీ ప్రయత్నించండి",
    media: { slide: "స్లైడ్", narration: "ఆడియో", source_figure: "చిత్రం", annotated_diagram: "లేబుల్‌లతో చిత్రం" },
    downloadSlide: "స్లైడ్ డౌన్‌లోడ్ చేయండి",
    myCourse: "నా కోర్సు", courseIntro: "మీ కంపెనీ ఇ-లెర్నింగ్ మాడ్యూళ్లు, పనిలో ఉపయోగించడానికి ఆమోదించిన గైడ్‌లతో.", module: "మాడ్యూల్", min: "నిమి", openGuide: "గైడ్ తెరవండి", guideComing: "గైడ్ సిద్ధమవుతోంది", inLms: "పాఠం మీ లెర్నింగ్ ప్లాట్‌ఫామ్‌లో", notInLanguage: "ఇది ఇంకా మీ భాషలో ఆమోదించబడలేదు.", showIn: "ఇందులో చూడండి",
  },
  hi: {
    hello: "नमस्ते", chooseTask: "आप कौन-सा काम कर रहे हैं?", searchPlaceholder: "समस्या अपने शब्दों में बताएँ", search: "खोजें",
    guidance: "मार्गदर्शन", practice: "अभ्यास", situationQuestion: "क्या कुछ असामान्य है?", normal: "नहीं, सामान्य काम", whichEquipment: "कौन-सा उपकरण?",
    back: "वापस", language: "भाषा", noTasks: "आपकी भूमिका के लिए अभी कोई काम तय नहीं है।", switchUser: "उपयोगकर्ता बदलें",
    practiceIntro: "काम पर आने से पहले असली निर्णयों का अभ्यास करें।", guided: "मार्गदर्शित अभ्यास", guidedHint: "संकेत और प्रतिक्रिया के साथ",
    independent: "स्वतंत्र जाँच", independentHint: "नई स्थिति, कोई संकेत नहीं", showHint: "संकेत दिखाएँ", choose: "आप क्या करेंगे?",
    submitDecision: "निर्णय जमा करें", correct: "सही निर्णय", incorrect: "सही निर्णय नहीं", rules: "क्या जाँचा गया",
    approvedGuidance: "स्वीकृत प्रक्रिया", tryAgain: "फिर से प्रयास करें",
    media: { slide: "स्लाइड", narration: "ऑडियो", source_figure: "चित्र", annotated_diagram: "लेबल वाला चित्र" },
    downloadSlide: "स्लाइड डाउनलोड करें",
    myCourse: "मेरा कोर्स", courseIntro: "आपकी कंपनी के ई-लर्निंग मॉड्यूल, और काम के समय इस्तेमाल के लिए स्वीकृत गाइड।", module: "मॉड्यूल", min: "मिनट", openGuide: "गाइड खोलें", guideComing: "गाइड तैयार की जा रही है", inLms: "पाठ आपके लर्निंग प्लेटफ़ॉर्म में", notInLanguage: "यह अभी आपकी भाषा में स्वीकृत नहीं है।", showIn: "इसमें देखें",
  },
  ml: {
    hello: "നമസ്കാരം", chooseTask: "നിങ്ങൾ ഏത് ജോലിയാണ് ചെയ്യുന്നത്?", searchPlaceholder: "പ്രശ്നം നിങ്ങളുടെ വാക്കുകളിൽ വിവരിക്കുക", search: "തിരയുക",
    guidance: "മാർഗ്ഗനിർദ്ദേശം", practice: "പരിശീലനം", situationQuestion: "എന്തെങ്കിലും അസാധാരണമായി ഉണ്ടോ?", normal: "ഇല്ല, സാധാരണ ജോലി", whichEquipment: "ഏത് ഉപകരണം?",
    back: "തിരികെ", language: "ഭാഷ", noTasks: "നിങ്ങളുടെ റോളിന് ഇതുവരെ ജോലികൾ സജ്ജീകരിച്ചിട്ടില്ല.", switchUser: "ഉപയോക്താവിനെ മാറ്റുക",
    practiceIntro: "ജോലിയിൽ സംഭവിക്കുന്നതിന് മുമ്പ് യഥാർത്ഥ തീരുമാനങ്ങൾ പരിശീലിക്കുക.", guided: "മാർഗ്ഗനിർദ്ദേശിത പരിശീലനം", guidedHint: "സൂചനകളും പ്രതികരണവും സഹിതം",
    independent: "സ്വതന്ത്ര പരിശോധന", independentHint: "പുതിയ സാഹചര്യം, സൂചനകളില്ല", showHint: "സൂചന കാണിക്കുക", choose: "നിങ്ങൾ എന്ത് ചെയ്യും?",
    submitDecision: "തീരുമാനം സമർപ്പിക്കുക", correct: "ശരിയായ തീരുമാനം", incorrect: "ശരിയായ തീരുമാനമല്ല", rules: "എന്താണ് പരിശോധിച്ചത്",
    approvedGuidance: "അംഗീകൃത നടപടിക്രമം", tryAgain: "വീണ്ടും ശ്രമിക്കുക",
    media: { slide: "സ്ലൈഡ്", narration: "ഓഡിയോ", source_figure: "ചിത്രം", annotated_diagram: "ലേബലുള്ള ചിത്രം" },
    downloadSlide: "സ്ലൈഡ് ഡൗൺലോഡ് ചെയ്യുക",
    myCourse: "എന്റെ കോഴ്സ്", courseIntro: "നിങ്ങളുടെ കമ്പനിയുടെ ഇ-ലേണിംഗ് മൊഡ്യൂളുകളും ജോലിയിൽ ഉപയോഗിക്കാനുള്ള അംഗീകൃത ഗൈഡുകളും.", module: "മൊഡ്യൂൾ", min: "മിനിറ്റ്", openGuide: "ഗൈഡ് തുറക്കുക", guideComing: "ഗൈഡ് തയ്യാറാകുന്നു", inLms: "പാഠം നിങ്ങളുടെ ലേണിംഗ് പ്ലാറ്റ്ഫോമിൽ", notInLanguage: "ഇത് ഇതുവരെ നിങ്ങളുടെ ഭാഷയിൽ അംഗീകരിച്ചിട്ടില്ല.", showIn: "ഇതിൽ കാണുക",
  },
  mr: {
    hello: "नमस्कार", chooseTask: "तुम्ही कोणते काम करत आहात?", searchPlaceholder: "समस्या तुमच्या शब्दांत सांगा", search: "शोधा",
    guidance: "मार्गदर्शन", practice: "सराव", situationQuestion: "काही असामान्य आहे का?", normal: "नाही, नेहमीचे काम", whichEquipment: "कोणते उपकरण?",
    back: "मागे", language: "भाषा", noTasks: "तुमच्या भूमिकेसाठी अजून कोणतीही कामे ठरवलेली नाहीत.", switchUser: "वापरकर्ता बदला",
    practiceIntro: "कामावर प्रसंग येण्यापूर्वी खऱ्या निर्णयांचा सराव करा.", guided: "मार्गदर्शित सराव", guidedHint: "संकेत आणि अभिप्रायासह",
    independent: "स्वतंत्र तपासणी", independentHint: "नवी परिस्थिती, संकेत नाहीत", showHint: "संकेत दाखवा", choose: "तुम्ही काय कराल?",
    submitDecision: "निर्णय सादर करा", correct: "योग्य निर्णय", incorrect: "योग्य निर्णय नाही", rules: "काय तपासले गेले",
    approvedGuidance: "मंजूर प्रक्रिया", tryAgain: "पुन्हा प्रयत्न करा",
    media: { slide: "स्लाइड", narration: "ऑडिओ", source_figure: "आकृती", annotated_diagram: "लेबल असलेली आकृती" },
    downloadSlide: "स्लाइड डाउनलोड करा",
    myCourse: "माझा कोर्स", courseIntro: "तुमच्या कंपनीचे ई-लर्निंग मॉड्यूल, आणि कामावर वापरण्यासाठी मंजूर मार्गदर्शक.", module: "मॉड्यूल", min: "मिनिटे", openGuide: "मार्गदर्शक उघडा", guideComing: "मार्गदर्शक तयार होत आहे", inLms: "धडा तुमच्या लर्निंग प्लॅटफॉर्मवर", notInLanguage: "हे अद्याप तुमच्या भाषेत मंजूर नाही.", showIn: "यात पाहा",
  },
  bn: {
    hello: "নমস্কার", chooseTask: "আপনি কোন কাজ করছেন?", searchPlaceholder: "সমস্যাটি নিজের ভাষায় বলুন", search: "খুঁজুন",
    guidance: "নির্দেশনা", practice: "অনুশীলন", situationQuestion: "অস্বাভাবিক কিছু আছে কি?", normal: "না, স্বাভাবিক কাজ", whichEquipment: "কোন যন্ত্র?",
    back: "ফিরে যান", language: "ভাষা", noTasks: "আপনার ভূমিকার জন্য এখনও কোনো কাজ ঠিক করা হয়নি।", switchUser: "ব্যবহারকারী বদলান",
    practiceIntro: "কাজে ঘটার আগেই আসল সিদ্ধান্তগুলি অনুশীলন করুন।", guided: "নির্দেশিত অনুশীলন", guidedHint: "ইঙ্গিত ও মতামতসহ",
    independent: "স্বাধীন যাচাই", independentHint: "নতুন পরিস্থিতি, কোনো ইঙ্গিত নেই", showHint: "ইঙ্গিত দেখান", choose: "আপনি কী করবেন?",
    submitDecision: "সিদ্ধান্ত জমা দিন", correct: "সঠিক সিদ্ধান্ত", incorrect: "সঠিক সিদ্ধান্ত নয়", rules: "কী যাচাই করা হয়েছে",
    approvedGuidance: "অনুমোদিত পদ্ধতি", tryAgain: "আবার চেষ্টা করুন",
    media: { slide: "স্লাইড", narration: "অডিও", source_figure: "চিত্র", annotated_diagram: "লেবেলযুক্ত চিত্র" },
    downloadSlide: "স্লাইড ডাউনলোড করুন",
    myCourse: "আমার কোর্স", courseIntro: "আপনার কোম্পানির ই-লার্নিং মডিউল, কাজের সময় ব্যবহারের জন্য অনুমোদিত গাইড সহ।", module: "মডিউল", min: "মিনিট", openGuide: "গাইড খুলুন", guideComing: "গাইড তৈরি হচ্ছে", inLms: "পাঠ আপনার লার্নিং প্ল্যাটফর্মে", notInLanguage: "এটি এখনও আপনার ভাষায় অনুমোদিত নয়।", showIn: "এতে দেখুন",
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
