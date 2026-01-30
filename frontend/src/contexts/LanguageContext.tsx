'use client';

/**
 * Language Context
 * ================
 * Global language state for the entire application.
 * Provides translate() function with caching.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'en' | 'ta' | 'hi';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (text: string) => string;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Static translations (loaded from backend, cached locally)
const STATIC_TRANSLATIONS: Record<string, Record<string, string>> = {
    // Home Page - Hero
    "Secure & Confidential": { "ta": "பாதுகாப்பான & ரகசியமான", "hi": "सुरक्षित और गोपनीय" },
    "Healthcare": { "ta": "சுகாதாரம்", "hi": "स्वास्थ्य सेवा" },
    "accessible": { "ta": "அணுகக்கூடிய", "hi": "सुलभ" },
    "anytime,": { "ta": "எந்நேரமும்,", "hi": "कभी भी," },
    "anywhere.": { "ta": "எங்கிருந்தும்.", "hi": "कहीं भी।" },
    "Connect with certified doctors instantly. Record symptoms in your language, share securely, and get care when you need it.": { "ta": "உடனடியாக சான்றளிக்கப்பட்ட மருத்துவர்களுடன் இணையுங்கள். உங்கள் மொழியில் அறிகுறிகளை பதிவு செய்து, பாதுகாப்பாக பகிர்ந்து, தேவைப்படும்போது உதவி பெறுங்கள்.", "hi": "प्रमाणित डॉक्टरों से तुरंत जुड़ें। अपनी भाषा में लक्षण दर्ज करें, सुरक्षित रूप से साझा करें, और जब आवश्यकता हो तब देखभाल प्राप्त करें।" },
    "Get Started": { "ta": "தொடங்கு", "hi": "शुरू करें" },
    "Telemedicine": { "ta": "தொலை மருத்துவம்", "hi": "टेलीमेडिसिन" },
    "General Physician": { "ta": "பொது மருத்துவர்", "hi": "सामान्य चिकित्सक" },
    "Available Now": { "ta": "இப்போது கிடைக்கும்", "hi": "अभी उपलब्ध" },
    "Call": { "ta": "அழைப்பு", "hi": "कॉल" },

    // Home Page - Portal Cards
    "Patient Portal": { "ta": "நோயாளி போர்டல்", "hi": "रोगी पोर्टल" },
    "Log symptoms, schedule consultations, and access your health records securely.": { "ta": "அறிகுறிகளை பதிவு செய்து, ஆலோசனைகளை திட்டமிட்டு, உங்கள் சுகாதார பதிவுகளை பாதுகாப்பாக அணுகுங்கள்.", "hi": "लक्षण दर्ज करें, परामर्श शेड्यूल करें, और अपने स्वास्थ्य रिकॉर्ड को सुरक्षित रूप से एक्सेस करें।" },
    "Voice symptom logging": { "ta": "குரல் அறிகுறி பதிவு", "hi": "आवाज से लक्षण लॉगिंग" },
    "Consent management": { "ta": "சம்மத மேலாண்மை", "hi": "सहमति प्रबंधन" },
    "Doctor consultations": { "ta": "மருத்துவ ஆலோசனைகள்", "hi": "डॉक्टर परामर्श" },
    "Enter Portal": { "ta": "போர்டலுக்குள் நுழை", "hi": "पोर्टल में प्रवेश करें" },
    "Doctor Portal": { "ta": "மருத்துவர் போர்டல்", "hi": "डॉक्टर पोर्टल" },
    "Review patient cases, conduct consultations, and manage prescriptions.": { "ta": "நோயாளி வழக்குகளை மதிப்பாய்வு செய்து, ஆலோசனைகளை நடத்தி, மருந்து சீட்டுகளை நிர்வகிக்கவும்.", "hi": "रोगी मामलों की समीक्षा करें, परामर्श करें, और नुस्खे प्रबंधित करें।" },
    "Patient queue": { "ta": "நோயாளி வரிசை", "hi": "रोगी कतार" },
    "Consultation tools": { "ta": "ஆலோசனை கருவிகள்", "hi": "परामर्श उपकरण" },
    "Prescription writing": { "ta": "மருந்து சீட்டு எழுதுதல்", "hi": "नुस्खा लेखन" },
    "Health Worker Portal": { "ta": "சுகாதார பணியாளர் போர்டல்", "hi": "स्वास्थ्य कार्यकर्ता पोर्टल" },
    "Assist patients with symptom logging and technology — with their permission.": { "ta": "நோயாளிகளுக்கு அவர்களின் அனுமதியுடன் அறிகுறி பதிவு மற்றும் தொழில்நுட்பத்தில் உதவுங்கள்.", "hi": "रोगियों की अनुमति से लक्षण लॉगिंग और तकनीक में उनकी सहायता करें।" },
    "Assisted access": { "ta": "உதவி அணுகல்", "hi": "सहायता प्राप्त एक्सेस" },
    "Time-limited sessions": { "ta": "நேர வரையறுக்கப்பட்ட அமர்வுகள்", "hi": "समय-सीमित सत्र" },
    "Upload support": { "ta": "பதிவேற்ற ஆதரவு", "hi": "अपलोड समर्थन" },

    // Home Page - Consent Section
    "Your Consent, Your Control": { "ta": "உங்கள் சம்மதம், உங்கள் கட்டுப்பாடு", "hi": "आपकी सहमति, आपका नियंत्रण" },
    "You choose what data to share": { "ta": "என்ன தரவை பகிர்வது என்பதை நீங்கள் தேர்வு செய்கிறீர்கள்", "hi": "आप चुनते हैं कि कौन सा डेटा साझा करना है" },
    "Revoke access anytime": { "ta": "எப்போது வேண்டுமானாலும் அணுகலை ரத்து செய்யவும்", "hi": "कभी भी एक्सेस रद्द करें" },
    "Transparent data usage": { "ta": "வெளிப்படையான தரவு பயன்பாடு", "hi": "पारदर्शी डेटा उपयोग" },
    "Doctor is the only clinical authority": { "ta": "மருத்துவர் மட்டுமே மருத்துவ அதிகாரம்", "hi": "डॉक्टर एकमात्र क्लीनिकल अथॉरिटी है" },

    // Home Page - Footer
    "About": { "ta": "பற்றி", "hi": "के बारे में" },
    "Privacy Policy": { "ta": "தனியுரிமைக் கொள்கை", "hi": "गोपनीयता नीति" },
    "Terms of Service": { "ta": "சேவை விதிமுறைகள்", "hi": "सेवा की शर्तें" },
    "Contact": { "ta": "தொடர்பு", "hi": "संपर्क करें" },
    "This platform facilitates consultations. All clinical decisions are made by licensed doctors.": { "ta": "இந்த தளம் ஆலோசனைகளை எளிதாக்குகிறது. அனைத்து மருத்துவ முடிவுகளும் உரிமம் பெற்ற மருத்துவர்களால் எடுக்கப்படுகின்றன.", "hi": "यह प्लेटफ़ॉर्म परामर्श की सुविधा देता है। सभी क्लीनिकल निर्णय लाइसेंस प्राप्त डॉक्टरों द्वारा किए जाते हैं।" },

    // Patient Dashboard
    "Dashboard": { "ta": "டாஷ்போர்டு", "hi": "डैशबोर्ड" },
    "Welcome": { "ta": "வரவேற்கிறோம்", "hi": "स्वागत है" },
    "What would you like to do?": { "ta": "நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?", "hi": "आप क्या करना चाहेंगे?" },
    "Log Symptoms": { "ta": "அறிகுறிகளை பதிவு செய்", "hi": "लक्षण दर्ज करें" },
    "Talk to Health Assistant": { "ta": "சுகாதார உதவியாளரிடம் பேசு", "hi": "स्वास्थ्य सहायक से बात करें" },
    "Health Assistant": { "ta": "சுகாதார உதவியாளர்", "hi": "स्वास्थ्य सहायक" },
    "Answer questions about how you feel": { "ta": "நீங்கள் எப்படி உணர்கிறீர்கள் என்பதை பதிலளிக்கவும்", "hi": "आप कैसा महसूस कर रहे हैं इसका जवाब दें" },
    "Consult a Doctor": { "ta": "மருத்துவரை ஆலோசிக்கவும்", "hi": "डॉक्टर से परामर्श लें" },
    "Book audio or video consultation": { "ta": "ஆடியோ அல்லது வீடியோ ஆலோசனை பதிவு செய்யவும்", "hi": "ऑडियो या वीडियो परामर्श बुक करें" },
    "Appointments": { "ta": "சந்திப்புகள்", "hi": "अपॉइंटमेंट" },
    "View scheduled consultations": { "ta": "திட்டமிடப்பட்ட ஆலோசனைகளைக் காண்", "hi": "निर्धारित परामर्श देखें" },
    "Medical Records": { "ta": "மருத்துவ பதிவுகள்", "hi": "चिकित्सा रिकॉर्ड" },
    "Logbook, reports, prescriptions": { "ta": "பதிவேடு, அறிக்கைகள், மருந்து சீட்டுகள்", "hi": "लॉगबुक, रिपोर्ट, नुस्खे" },
    "My Records": { "ta": "எனது பதிவுகள்", "hi": "मेरे रिकॉर्ड" },
    "Upload Reports": { "ta": "அறிக்கைகளை பதிவேற்று", "hi": "रिपोर्ट अपलोड करें" },
    "My Profile": { "ta": "என் சுயவிவரம்", "hi": "मेरी प्रोफ़ाइल" },
    "Privacy Settings": { "ta": "தனியுரிமை அமைப்புகள்", "hi": "गोपनीयता सेटिंग्स" },
    "Logout": { "ta": "வெளியேறு", "hi": "लॉग आउट" },
    "Track your symptoms over time": { "ta": "காலப்போக்கில் உங்கள் அறிகுறிகளை கண்காணிக்கவும்", "hi": "समय के साथ अपने लक्षणों को ट्रैक करें" },
    "entries": { "ta": "பதிவுகள்", "hi": "प्रविष्टियां" },
    "past": { "ta": "கடந்த", "hi": "पिछले" },
    "You control what is shared with doctors": { "ta": "மருத்துவர்களுடன் என்ன பகிரப்படுகிறது என்பதை நீங்கள் கட்டுப்படுத்துகிறீர்கள்", "hi": "आप नियंत्रित करते हैं कि डॉक्टरों के साथ क्या साझा किया जाता है" },
    "items": { "ta": "உருப்படிகள்", "hi": "आइटम" },
    "waiting to sync": { "ta": "ஒத்திசைக்க காத்திருக்கிறது", "hi": "सिंक होने की प्रतीक्षा" },
    "Sync Now": { "ta": "இப்போது ஒத்திசை", "hi": "अभी सिंक करें" },
    "For Emergencies": { "ta": "அவசர நிலைகளுக்கு", "hi": "आपातकाल के लिए" },
    "Visit your nearest hospital": { "ta": "உங்கள் அருகிலுள்ள மருத்துவமனைக்குச் செல்லுங்கள்", "hi": "अपने निकटतम अस्पताल जाएं" },
    "Doctor Summary Available": { "ta": "மருத்துவர் சுருக்கம் கிடைக்கிறது", "hi": "डॉक्टर सारांश उपलब्ध" },
    "View your recent consultation summary": { "ta": "உங்கள் சமீபத்திய ஆலோசனை சுருக்கத்தைக் காண்", "hi": "अपना हालिया परामर्श सारांश देखें" },
    "entries not shared": { "ta": "பகிரப்படாத பதிவுகள்", "hi": "साझा नहीं की गई प्रविष्टियां" },
    "Share with your doctor when ready": { "ta": "தயாராக இருக்கும்போது உங்கள் மருத்துவருடன் பகிர்ந்து கொள்ளுங்கள்", "hi": "तैयार होने पर अपने डॉक्टर के साथ साझा करें" },
    "Data saved locally": { "ta": "தரவு உள்ளூரில் சேமிக்கப்பட்டது", "hi": "डेटा स्थानीय रूप से सहेजा गया" },

    // Symptom Logbook
    "Symptom Logbook": { "ta": "அறிகுறி பதிவேடு", "hi": "लक्षण लॉगबुक" },
    "Your medical diary": { "ta": "உங்கள் மருத்துவ நாட்குறிப்பு", "hi": "आपकी चिकित्सा डायरी" },
    "Write Entry": { "ta": "பதிவு எழுது", "hi": "प्रविष्टि लिखें" },
    "Voice Entry": { "ta": "குரல் பதிவு", "hi": "वॉयस प्रविष्टि" },
    "Talk to Assistant": { "ta": "உதவியாளரிடம் பேசு", "hi": "सहायक से बात करें" },
    "All": { "ta": "அனைத்தும்", "hi": "सभी" },
    "Manual": { "ta": "கைமுறை", "hi": "मैनुअल" },
    "Voice": { "ta": "குரல்", "hi": "वॉयस" },
    "Chatbot": { "ta": "சாட்பாட்", "hi": "चैटबॉट" },
    "No entries yet": { "ta": "இன்னும் பதிவுகள் இல்லை", "hi": "अभी तक कोई प्रविष्टि नहीं" },
    "Start by adding your first symptom": { "ta": "உங்கள் முதல் அறிகுறியைச் சேர்ப்பதன் மூலம் தொடங்குங்கள்", "hi": "अपना पहला लक्षण जोड़कर शुरू करें" },
    "Original Text": { "ta": "அசல் உரை", "hi": "मूल पाठ" },
    "Duration": { "ta": "கால அளவு", "hi": "अवधि" },
    "Notes": { "ta": "குறிப்புகள்", "hi": "नोट्स" },
    "Voice recording available": { "ta": "குரல் பதிவு கிடைக்கிறது", "hi": "वॉयस रिकॉर्डिंग उपलब्ध" },
    "Shared with doctor": { "ta": "மருத்துவருடன் பகிரப்பட்டது", "hi": "डॉक्टर के साथ साझा किया गया" },
    "Not shared": { "ta": "பகிரப்படவில்லை", "hi": "साझा नहीं किया गया" },
    "Doctor reviewed": { "ta": "மருத்துவர் மதிப்பாய்வு செய்தார்", "hi": "डॉक्टर ने समीक्षा की" },

    // New Entry
    "New Entry": { "ta": "புதிய பதிவு", "hi": "नई प्रविष्टि" },
    "Describe how you feel": { "ta": "நீங்கள் எப்படி உணர்கிறீர்கள் என்பதை விவரிக்கவும்", "hi": "बताएं कि आप कैसा महसूस कर रहे हैं" },
    "Include when it started, how severe, and any changes": { "ta": "எப்போது தொடங்கியது, எவ்வளவு தீவிரம், மாற்றங்கள் ஆகியவற்றை சேர்க்கவும்", "hi": "शुरू होने का समय, गंभीरता और बदलाव शामिल करें" },
    "Tap to record": { "ta": "பதிவு செய்ய தட்டவும்", "hi": "रिकॉर्ड करने के लिए टैप करें" },
    "Tap to stop": { "ta": "நிறுத்த தட்டவும்", "hi": "रोकने के लिए टैप करें" },
    "Speak clearly about your symptoms": { "ta": "உங்கள் அறிகுறிகளைப் பற்றி தெளிவாகப் பேசவும்", "hi": "अपने लक्षणों के बारे में स्पष्ट रूप से बोलें" },
    "Transcript": { "ta": "எழுத்துப்பெயர்ப்பு", "hi": "प्रतिलेख" },
    "You can edit the transcript above": { "ta": "மேலே உள்ள எழுத்துப்பெயர்ப்பை நீங்கள் திருத்தலாம்", "hi": "आप ऊपर प्रतिलेख संपादित कर सकते हैं" },
    "Record again": { "ta": "மீண்டும் பதிவு செய்", "hi": "फिर से रिकॉर्ड करें" },
    "Save to Logbook": { "ta": "பதிவேட்டில் சேமி", "hi": "लॉगबुक में सहेजें" },
    "Saving...": { "ta": "சேமிக்கிறது...", "hi": "सहेज रहा है..." },
    "Entry saved to logbook!": { "ta": "பதிவு பதிவேட்டில் சேமிக்கப்பட்டது!", "hi": "प्रविष्टि लॉगबुक में सहेजी गई!" },
    "Entry will be saved locally. You can share it with doctors later.": { "ta": "பதிவு உள்ளூரில் சேமிக்கப்படும். நீங்கள் பின்னர் மருத்துவர்களுடன் பகிரலாம்.", "hi": "प्रविष्टि स्थानीय रूप से सहेजी जाएगी। आप बाद में डॉक्टरों के साथ साझा कर सकते हैं।" },

    // Profile
    "Age": { "ta": "வயது", "hi": "आयु" },
    "years": { "ta": "ஆண்டுகள்", "hi": "वर्ष" },
    "Gender": { "ta": "பாலினம்", "hi": "लिंग" },
    "Location": { "ta": "இடம்", "hi": "स्थान" },
    "Preferred Language": { "ta": "விருப்பமான மொழி", "hi": "पसंदीदा भाषा" },
    "Emergency Contact": { "ta": "அவசர தொடர்பு", "hi": "आपातकालीन संपर्क" },
    "Not set": { "ta": "அமைக்கப்படவில்லை", "hi": "सेट नहीं" },
    "Edit Profile": { "ta": "சுயவிவரத்தைத் திருத்து", "hi": "प्रोफ़ाइल संपादित करें" },
    "10-digit phone number": { "ta": "10-இலக்க தொலைபேசி எண்", "hi": "10-अंकीय फ़ोन नंबर" },
    "Name": { "ta": "பெயர்", "hi": "नाम" },
    "Save Changes": { "ta": "மாற்றங்களைச் சேமி", "hi": "परिवर्तन सहेजें" },
    "Your profile is only visible to you and doctors you consult": { "ta": "உங்கள் சுயவிவரம் உங்களுக்கும் நீங்கள் ஆலோசிக்கும் மருத்துவர்களுக்கும் மட்டுமே தெரியும்", "hi": "आपकी प्रोफ़ाइल केवल आपको और जिन डॉक्टरों से आप परामर्श करते हैं उन्हें दिखाई देती है" },

    // Consult
    "Choose consultation type": { "ta": "ஆலோசனை வகையைத் தேர்வு செய்யவும்", "hi": "परामर्श प्रकार चुनें" },
    "Video Call": { "ta": "வீடியோ அழைப்பு", "hi": "वीडियो कॉल" },
    "See and talk to doctor": { "ta": "மருத்துவரைப் பார்த்துப் பேசுங்கள்", "hi": "डॉक्टर को देखें और बात करें" },
    "Audio Call": { "ta": "ஆடியோ அழைப்பு", "hi": "ऑडियो कॉल" },
    "Voice call only": { "ta": "குரல் அழைப்பு மட்டுமே", "hi": "केवल वॉयस कॉल" },
    "Select a doctor": { "ta": "ஒரு மருத்துவரைத் தேர்ந்தெடுக்கவும்", "hi": "एक डॉक्टर चुनें" },
    "Available": { "ta": "கிடைக்கிறது", "hi": "उपलब्ध" },
    "What do you want to share?": { "ta": "நீங்கள் என்ன பகிர விரும்புகிறீர்கள்?", "hi": "आप क्या साझा करना चाहते हैं?" },
    "You decide what the doctor sees": { "ta": "மருத்துவர் என்ன பார்க்க வேண்டும் என்பதை நீங்கள் முடிவு செய்கிறீர்கள்", "hi": "आप तय करते हैं कि डॉक्टर क्या देखता है" },
    "Select entries to share:": { "ta": "பகிர பதிவுகளைத் தேர்ந்தெடுக்கவும்:", "hi": "साझा करने के लिए प्रविष्टियां चुनें:" },
    "This is your choice. Doctor will only see what you allow.": { "ta": "இது உங்கள் தேர்வு. நீங்கள் அனுமதிப்பதை மட்டுமே மருத்துவர் பார்ப்பார்.", "hi": "यह आपकी पसंद है। डॉक्टर केवल वही देखेगा जो आप अनुमति देते हैं।" },
    "Confirm Booking": { "ta": "பதிவை உறுதிப்படுத்து", "hi": "बुकिंग की पुष्टि करें" },
    "Consultation Type": { "ta": "ஆலோசனை வகை", "hi": "परामर्श प्रकार" },
    "Sharing": { "ta": "பகிர்வு", "hi": "साझाकरण" },
    "Nothing": { "ta": "எதுவுமில்லை", "hi": "कुछ नहीं" },
    "Book Consultation": { "ta": "ஆலோசனை பதிவு", "hi": "परामर्श बुक करें" },
    "Consultation booked successfully! Doctor will call you soon.": { "ta": "ஆலோசனை வெற்றிகரமாக பதிவு செய்யப்பட்டது! மருத்துவர் விரைவில் உங்களை அழைப்பார்.", "hi": "परामर्श सफलतापूर्वक बुक हो गया! डॉक्टर जल्द ही आपको कॉल करेंगे।" },
    "Back": { "ta": "பின்செல்", "hi": "वापस" },

    // Records
    "Logbook": { "ta": "பதிவேடு", "hi": "लॉगबुक" },
    "Consultations": { "ta": "ஆலோசனைகள்", "hi": "परामर्श" },
    "Prescriptions": { "ta": "மருந்து சீட்டுகள்", "hi": "नुस्खे" },
    "No logbook entries yet": { "ta": "இன்னும் பதிவேடு பதிவுகள் இல்லை", "hi": "अभी तक कोई लॉगबुक प्रविष्टि नहीं" },
    "No consultations yet": { "ta": "இன்னும் ஆலோசனைகள் இல்லை", "hi": "अभी तक कोई परामर्श नहीं" },
    "No prescriptions yet": { "ta": "இன்னும் மருந்து சீட்டுகள் இல்லை", "hi": "अभी तक कोई नुस्खा नहीं" },
    "Shared": { "ta": "பகிரப்பட்டது", "hi": "साझा किया गया" },
    "Doctor Summary": { "ta": "மருத்துவர் சுருக்கம்", "hi": "डॉक्टर सारांश" },
    "Completed": { "ta": "முடிந்தது", "hi": "पूर्ण" },
    "Scheduled": { "ta": "திட்டமிடப்பட்டது", "hi": "निर्धारित" },
    "Prescription": { "ta": "மருந்து சீட்டு", "hi": "नुस्खा" },
    "By": { "ta": "மூலம்", "hi": "द्वारा" },
    "Demo prescription - not for actual use": { "ta": "டெமோ மருந்து சீட்டு - உண்மையான பயன்பாட்டிற்கு அல்ல", "hi": "डेमो नुस्खा - वास्तविक उपयोग के लिए नहीं" },
    "Your records are private. You control who sees them.": { "ta": "உங்கள் பதிவுகள் தனிப்பட்டவை. அவற்றை யார் பார்க்கிறார்கள் என்பதை நீங்கள் கட்டுப்படுத்துகிறீர்கள்.", "hi": "आपके रिकॉर्ड निजी हैं। आप नियंत्रित करते हैं कि उन्हें कौन देखता है।" },

    // Appointments
    "Book New Consultation": { "ta": "புதிய ஆலோசனை பதிவு", "hi": "नया परामर्श बुक करें" },
    "Upcoming": { "ta": "வரவிருக்கும்", "hi": "आगामी" },
    "Past Consultations": { "ta": "கடந்த ஆலோசனைகள்", "hi": "पिछले परामर्श" },
    "No upcoming appointments": { "ta": "வரவிருக்கும் சந்திப்புகள் இல்லை", "hi": "कोई आगामी अपॉइंटमेंट नहीं" },
    "No past consultations": { "ta": "கடந்த ஆலோசனைகள் இல்லை", "hi": "कोई पिछला परामर्श नहीं" },
    "Consultations are with verified doctors only": { "ta": "ஆலோசனைகள் சரிபார்க்கப்பட்ட மருத்துவர்களுடன் மட்டுமே", "hi": "परामर्श केवल सत्यापित डॉक्टरों के साथ" },

    // Login
    "Patient Login": { "ta": "நோயாளி உள்நுழைவு", "hi": "मरीज लॉगिन" },
    "Health Worker Login": { "ta": "சுகாதார பணியாளர் உள்நுழைவு", "hi": "स्वास्थ्य कार्यकर्ता लॉगिन" },
    "Login with your phone number": { "ta": "உங்கள் தொலைபேசி எண்ணுடன் உள்நுழையவும்", "hi": "अपने फ़ोन नंबर से लॉगिन करें" },
    "Login to assist patients": { "ta": "நோயாளிகளுக்கு உதவ உள்நுழையவும்", "hi": "मरीजों की सहायता के लिए लॉगिन करें" },
    "Phone Number": { "ta": "தொலைபேசி எண்", "hi": "फ़ोन नंबर" },
    "Enter 10-digit number": { "ta": "10-இலக்க எண்ணை உள்ளிடவும்", "hi": "10-अंकीय नंबर दर्ज करें" },
    "Get OTP": { "ta": "OTP பெறு", "hi": "OTP प्राप्त करें" },
    "Sending OTP...": { "ta": "OTP அனுப்புகிறது...", "hi": "OTP भेज रहा है..." },
    "Enter OTP": { "ta": "OTP உள்ளிடவும்", "hi": "OTP दर्ज करें" },
    "Verify & Login": { "ta": "சரிபார்த்து உள்நுழை", "hi": "सत्यापित करें और लॉगिन करें" },
    "Verifying...": { "ta": "சரிபார்க்கிறது...", "hi": "सत्यापित हो रहा है..." },
    "Change Number": { "ta": "எண்ணை மாற்று", "hi": "नंबर बदलें" },
    "Back to Home": { "ta": "முகப்புக்கு திரும்பு", "hi": "होम पर वापस" },
    "Demo Mode": { "ta": "டெமோ பயன்முறை", "hi": "डेमो मोड" },
    "OTP sent to": { "ta": "OTP அனுப்பப்பட்டது", "hi": "OTP भेजा गया" },
    "Please enter a valid 10-digit phone number": { "ta": "சரியான 10-இலக்க தொலைபேசி எண்ணை உள்ளிடவும்", "hi": "कृपया मान्य 10-अंकीय फ़ोन नंबर दर्ज करें" },
    "Please enter the 6-digit OTP": { "ta": "6-இலக்க OTP ஐ உள்ளிடவும்", "hi": "कृपया 6-अंकीय OTP दर्ज करें" },
    "Assisted Mode": { "ta": "உதவி பயன்முறை", "hi": "सहायता मोड" },
    "Invalid OTP": { "ta": "தவறான OTP", "hi": "अमान्य OTP" },
    "Failed to send OTP": { "ta": "OTP அனுப்ப முடியவில்லை", "hi": "OTP भेजने में विफल" },
    "Please request a new OTP": { "ta": "புதிய OTP கோரவும்", "hi": "कृपया नया OTP का अनुरोध करें" },

    // Demo
    "Demo Data": { "ta": "டெமோ தரவு", "hi": "डेमो डेटा" },

    // Chatbot / Intake
    "Health Intake": { "ta": "சுகாதார தகவல்", "hi": "स्वास्थ्य सेवन" },
    "Answer a few questions about how you feel": { "ta": "நீங்கள் எப்படி உணர்கிறீர்கள் என்பது பற்றி சில கேள்விகளுக்கு பதிலளிக்கவும்", "hi": "आप कैसा महसूस कर रहे हैं इसके बारे में कुछ सवालों के जवाब दें" },
    "This is intake only — not medical advice or diagnosis.": { "ta": "இது தகவல் சேகரிப்பு மட்டுமே — மருத்துவ ஆலோசனை அல்லது நோயறிதல் அல்ல.", "hi": "यह केवल सेवन है — चिकित्सा सलाह या निदान नहीं।" },
    "Type your answer...": { "ta": "உங்கள் பதிலை உள்ளிடவும்...", "hi": "अपना उत्तर टाइप करें..." },
    "View Logbook": { "ta": "பதிவேட்டைக் காண்", "hi": "लॉगबुक देखें" },

    // Queue Status
    "Booking Confirmed": { "ta": "முன்பதிவு உறுதி", "hi": "बुकिंग की पुष्टि" },
    "Your consultation with": { "ta": "உங்கள் ஆலோசனை", "hi": "आपका परामर्श" },
    "entries shared": { "ta": "பகிரப்பட்ட பதிவுகள்", "hi": "साझा प्रविष्टियां" },
    "No data shared": { "ta": "தரவு பகிரப்படவில்லை", "hi": "कोई डेटा साझा नहीं" },
    "Back to Dashboard": { "ta": "டாஷ்போர்டுக்கு திரும்பு", "hi": "डैशबोर्ड पर वापस" },
    "Estimated wait": { "ta": "மதிப்பிடப்பட்ட காத்திருப்பு", "hi": "अनुमानित प्रतीक्षा" },
    "minutes": { "ta": "நிமிடங்கள்", "hi": "मिनट" },
    "You will be notified when the doctor is ready": { "ta": "மருத்துவர் தயாராக இருக்கும்போது உங்களுக்கு அறிவிக்கப்படும்", "hi": "जब डॉक्टर तैयार होंगे तो आपको सूचित किया जाएगा" },

    // Offline / Sync
    "You are offline. Data saved locally.": { "ta": "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். தரவு உள்ளூரில் சேமிக்கப்பட்டது.", "hi": "आप ऑफ़लाइन हैं। डेटा स्थानीय रूप से सहेजा गया।" },
    "Syncing your data...": { "ta": "உங்கள் தரவை ஒத்திசைக்கிறது...", "hi": "आपका डेटा सिंक हो रहा है..." },
    "All data synced": { "ta": "அனைத்து தரவும் ஒத்திசைக்கப்பட்டது", "hi": "सभी डेटा सिंक हो गया" },
    "Data pending sync": { "ta": "ஒத்திசைக்க காத்திருக்கும் தரவு", "hi": "सिंक होने की प्रतीक्षा में डेटा" },
    "pending": { "ta": "நிலுவையில்", "hi": "लंबित" },
    "Just now": { "ta": "இப்போதே", "hi": "अभी" },
    "minutes ago": { "ta": "நிமிடங்களுக்கு முன்", "hi": "मिनट पहले" },
    "Saved locally! Will sync when online.": { "ta": "உள்ளூரில் சேமிக்கப்பட்டது! ஆன்லைனில் ஒத்திசைக்கப்படும்.", "hi": "स्थानीय रूप से सहेजा गया! ऑनलाइन होने पर सिंक होगा।" },
    "Failed to save entry. Please try again.": { "ta": "பதிவை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.", "hi": "प्रविष्टि सहेजने में विफल। कृपया पुनः प्रयास करें।" },
    "You are offline. Entry will sync when connected.": { "ta": "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். இணைக்கப்படும்போது ஒத்திசைக்கப்படும்.", "hi": "आप ऑफ़लाइन हैं। कनेक्ट होने पर सिंक होगा।" },

    // Global Consent
    "Share Health Data": { "ta": "சுகாதார தரவைப் பகிர்", "hi": "स्वास्थ्य डेटा साझा करें" },
    "One simple decision for this consultation": { "ta": "இந்த ஆலோசனைக்கு ஒரு எளிய முடிவு", "hi": "इस परामर्श के लिए एक सरल निर्णय" },
    "Data Sharing Active": { "ta": "தரவு பகிர்வு செயலில் உள்ளது", "hi": "डेटा साझाकरण सक्रिय" },
    "All health notes are shared with your doctor": { "ta": "அனைத்து சுகாதார குறிப்புகளும் உங்கள் மருத்துவருடன் பகிரப்படுகின்றன", "hi": "सभी स्वास्थ्य नोट्स आपके डॉक्टर के साथ साझा किए गए हैं" },
    "Selected entries are shared with your doctor": { "ta": "தேர்ந்தெடுக்கப்பட்ட பதிவுகள் உங்கள் மருத்துவருடன் பகிரப்படுகின்றன", "hi": "चयनित प्रविष्टियां आपके डॉक्टर के साथ साझा की गई हैं" },
    "Reports included": { "ta": "அறிக்கைகள் சேர்க்கப்பட்டுள்ளன", "hi": "रिपोर्ट शामिल" },
    "Stop Sharing": { "ta": "பகிர்வதை நிறுத்து", "hi": "साझाकरण बंद करें" },
    "You can stop sharing anytime. Your data will remain in your logbook.": { "ta": "எப்போது வேண்டுமானாலும் பகிர்வதை நிறுத்தலாம். உங்கள் தரவு பதிவேட்டில் இருக்கும்.", "hi": "आप कभी भी साझाकरण बंद कर सकते हैं। आपका डेटा लॉगबुक में रहेगा।" },
    "This will share your health notes and reports with the doctor for this consultation only.": { "ta": "இது உங்கள் சுகாதார குறிப்புகளையும் அறிக்கைகளையும் இந்த ஆலோசனைக்கு மட்டும் மருத்துவருடன் பகிரும்.", "hi": "यह आपके स्वास्थ्य नोट्स और रिपोर्ट केवल इस परामर्श के लिए डॉक्टर के साथ साझा करेगा।" },
    "What will be shared": { "ta": "என்ன பகிரப்படும்", "hi": "क्या साझा किया जाएगा" },
    "Your symptom entries": { "ta": "உங்கள் அறிகுறி பதிவுகள்", "hi": "आपकी लक्षण प्रविष्टियां" },
    "Chatbot intake summaries": { "ta": "சாட்பாட் தகவல் சுருக்கங்கள்", "hi": "चैटबॉट सेवन सारांश" },
    "Uploaded reports": { "ta": "பதிவேற்றப்பட்ட அறிக்கைகள்", "hi": "अपलोड की गई रिपोर्ट" },
    "Share all entries": { "ta": "அனைத்து பதிவுகளையும் பகிர்", "hi": "सभी प्रविष्टियां साझा करें" },
    "Recommended": { "ta": "பரிந்துரைக்கப்படுகிறது", "hi": "अनुशंसित" },
    "Include uploaded reports": { "ta": "பதிவேற்றப்பட்ட அறிக்கைகளைச் சேர்", "hi": "अपलोड की गई रिपोर्ट शामिल करें" },
    "I Agree to Share": { "ta": "பகிர ஒப்புக்கொள்கிறேன்", "hi": "मैं साझा करने के लिए सहमत हूं" },
    "You control your data. You can revoke access anytime.": { "ta": "நீங்கள் உங்கள் தரவைக் கட்டுப்படுத்துகிறீர்கள். எப்போது வேண்டுமானாலும் அணுகலை ரத்து செய்யலாம்.", "hi": "आप अपने डेटा को नियंत्रित करते हैं। आप कभी भी एक्सेस रद्द कर सकते हैं।" },

    // Status
    "Loading": { "ta": "ஏற்றுகிறது", "hi": "लोड हो रहा है" },
    "Error": { "ta": "பிழை", "hi": "त्रुटि" },
    "Success": { "ta": "வெற்றி", "hi": "सफलता" },
    "Offline": { "ta": "ஆஃப்லைன்", "hi": "ऑफ़लाइन" },
    "Online": { "ta": "ஆன்லைன்", "hi": "ऑनलाइन" },
    "Syncing": { "ta": "ஒத்திசைக்கிறது", "hi": "सिंक हो रहा है" },
    "Synced": { "ta": "ஒத்திசைக்கப்பட்டது", "hi": "सिंक हो गया" },

    // Common
    "Save": { "ta": "சேமி", "hi": "सहेजें" },
    "Cancel": { "ta": "ரத்து செய்", "hi": "रद्द करें" },
    "Submit": { "ta": "சமர்ப்பி", "hi": "जमा करें" },
    "Next": { "ta": "அடுத்து", "hi": "अगला" },
    "Previous": { "ta": "முந்தைய", "hi": "पिछला" },
    "Close": { "ta": "மூடு", "hi": "बंद करें" },
    "Send": { "ta": "அனுப்பு", "hi": "भेजें" },
    "Search": { "ta": "தேடு", "hi": "खोजें" },
    "Filter": { "ta": "வடிகட்டு", "hi": "फ़िल्टर" },
    "View": { "ta": "காண்", "hi": "देखें" },
    "Edit": { "ta": "திருத்து", "hi": "संपादित करें" },
    "Delete": { "ta": "நீக்கு", "hi": "हटाएं" },
    "Continue": { "ta": "தொடரவும்", "hi": "जारी रखें" },

    // TopBar
    "CareVista": { "ta": "கேர்விஸ்டா", "hi": "केयरविस्टा" },
    "Patient": { "ta": "நோயாளி", "hi": "मरीज" },
    "Doctor": { "ta": "மருத்துவர்", "hi": "डॉक्टर" },
};

// Local storage key
const LANGUAGE_STORAGE_KEY = 'carevista_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [isLoading, setIsLoading] = useState(true);

    // Load language from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && (saved === 'en' || saved === 'ta' || saved === 'hi')) {
            setLanguageState(saved as Language);
        }
        setIsLoading(false);
    }, []);

    // Save language to localStorage when changed
    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }, []);

    // Translate function
    const t = useCallback((text: string): string => {
        if (language === 'en') return text;

        // Check static translations
        if (STATIC_TRANSLATIONS[text] && STATIC_TRANSLATIONS[text][language]) {
            return STATIC_TRANSLATIONS[text][language];
        }

        // Return original if no translation found
        return text;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Language names for selector
export const LANGUAGE_NAMES: Record<Language, string> = {
    en: 'English',
    ta: 'தமிழ்',
    hi: 'हिंदी',
};
