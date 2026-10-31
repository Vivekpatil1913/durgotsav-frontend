import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "../../context/LanguageContext.jsx";

// SRS §7 voice-to-text: the browser's own speech recognition (Chrome, Edge, Android, Safari). Where it is missing
// (Firefox) the microphone buttons are simply not shown.
const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const speechSupported = Boolean(Recognition);

export const VOICE_LANGS = [
  { code: "mr-IN", label: "मराठी" },
  { code: "hi-IN", label: "हिंदी" },
  { code: "en-IN", label: "English" },
];

// Spoken digits arrive as numerals or as words, depending on the language and the browser
const DIGIT_WORDS = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  शून्य: 0, एक: 1, दोन: 2, तीन: 3, चार: 4, पाच: 5, सहा: 6, सात: 7, आठ: 8, नऊ: 9,
  दो: 2, पांच: 5, पाँच: 5, छह: 6, छः: 6, नौ: 9,
};
export const spokenDigits = (text) =>
  text.toLowerCase().split(/\s+/).map((w) => (w in DIGIT_WORDS ? String(DIGIT_WORDS[w]) : w)).join("");

/**
 * Microphone button for one field. lang: "mr-IN" | "hi-IN" | "en-IN". onText(text): the recognised words.
 * onError(message): microphone blocked, nothing heard …
 */
export function VoiceButton({ lang, onText, onError, label }) {
  const t = useT();
  const [listening, setListening] = useState(false);
  const rec = useRef(null);
  useEffect(() => () => rec.current?.abort(), []);
  if (!Recognition) return null;

  function toggle() {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = new Recognition();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const text = Array.from(e.results, (res) => res[0].transcript).join(" ").trim();
      if (text) onText(text);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        onError?.(t("Allow microphone access in the browser to fill this by voice.", "आवाजाने माहिती भरण्यासाठी ब्राउझरला मायक्रोफोन वापरण्याची परवानगी द्या."));
      } else if (e.error === "no-speech") {
        onError?.(t("Nothing was heard. Tap the microphone and speak again.", "काहीही ऐकू आले नाही. मायक्रोफोनवर टॅप करून पुन्हा बोला."));
      } else if (e.error !== "aborted") {
        onError?.(t("Voice input is not available right now. Please type instead.", "आवाजाने माहिती भरणे सध्या शक्य नाही. कृपया टाइप करा."));
      }
    };
    r.onend = () => setListening(false);
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <button
      type="button"
      className={`voice-btn ${listening ? "is-listening" : ""}`}
      onClick={toggle}
      aria-pressed={listening}
      aria-label={listening ? t("Stop listening", "ऐकणे थांबवा") : label}
      title={listening ? t("Listening… tap to stop", "ऐकत आहे… थांबवण्यासाठी टॅप करा") : label}
    >
      {listening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
    </button>
  );
}

// Which language the microphones listen for (one choice for the whole form)
export function VoiceLanguage({ value, onChange }) {
  const t = useT();
  if (!Recognition) return null;
  return (
    <div className="voice-lang" role="radiogroup" aria-label={t("Voice input language", "आवाजाने माहिती भरण्याची भाषा")}>
      <span className="voice-lang__label"><Mic aria-hidden="true" /> {t("Fill by voice in:", "बोलून माहिती भरा:")}</span>
      {VOICE_LANGS.map((l) => (
        <button key={l.code} type="button" role="radio" aria-checked={value === l.code}
          className={`voice-lang__option ${value === l.code ? "is-active" : ""}`} onClick={() => onChange(l.code)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
