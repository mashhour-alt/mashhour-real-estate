"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/site-context";

type Direction = "ar-en" | "en-ar";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

const LABELS = {
  ar: {
    open: "المساعد الصوتي",
    close: "إغلاق",
    title: "الترجمة الصوتية",
    arToEn: "عربي ← إنجليزي",
    enToAr: "إنجليزي ← عربي",
    swap: "بدّل الاتجاه",
    tapToTalk: "اضغط وتكلم",
    listening: "بستمع…",
    translating: "بترجم…",
    speak: "انطق الترجمة",
    youSaid: "قلت",
    translation: "الترجمة",
    noSpeech: "مسمعتش صوت، حاول تاني",
    micDenied: "لازم تسمح باستخدام المايك من إعدادات المتصفح",
    notSupported: "المتصفح ده مش بيدعم التعرف على الصوت. جرّب Chrome أو Safari.",
    error: "حصل خطأ، حاول تاني",
  },
  en: {
    open: "Voice assistant",
    close: "Close",
    title: "Voice translation",
    arToEn: "Arabic → English",
    enToAr: "English → Arabic",
    swap: "Swap direction",
    tapToTalk: "Tap and speak",
    listening: "Listening…",
    translating: "Translating…",
    speak: "Play translation",
    youSaid: "You said",
    translation: "Translation",
    noSpeech: "No speech detected, try again",
    micDenied: "Please allow microphone access in your browser settings",
    notSupported: "This browser doesn't support speech recognition. Try Chrome or Safari.",
    error: "Something went wrong, try again",
  },
};

async function translate(text: string, from: string, to: string) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text,
  )}&langpair=${from}|${to}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("translation failed");
  const data = (await response.json()) as {
    responseData?: { translatedText?: string };
  };
  return data.responseData?.translatedText || "";
}

export default function VoiceAssistant() {
  const { lang } = useLang();
  const ui = LABELS[lang === "ar" ? "ar" : "en"];

  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<Direction>("ar-en");
  const [state, setState] = useState<"idle" | "listening" | "translating">("idle");
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [fromLang, toLang] = direction === "ar-en" ? ["ar", "en"] : ["en", "ar"];

  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    // window is only available after mount, so this check cannot run earlier.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!SR) setSupported(false);
  }, []);

  const speak = useCallback((text: string, langCode: string) => {
    if (!text || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === "ar" ? "ar-SA" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const start = useCallback(() => {
    setError("");
    setHeard("");
    setResult("");

    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = fromLang === "ar" ? "ar-EG" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = async (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
      if (!transcript) {
        setError(ui.noSpeech);
        setState("idle");
        return;
      }
      setHeard(transcript);
      setState("translating");
      try {
        const translated = await translate(transcript, fromLang, toLang);
        setResult(translated);
        speak(translated, toLang);
      } catch {
        setError(ui.error);
      } finally {
        setState("idle");
      }
    };

    recognition.onerror = (event) => {
      setError(event.error === "not-allowed" ? ui.micDenied : ui.error);
      setState("idle");
    };

    recognition.onend = () => {
      setState((current) => (current === "listening" ? "idle" : current));
    };

    try {
      recognition.start();
      setState("listening");
    } catch {
      setError(ui.error);
      setState("idle");
    }
  }, [fromLang, toLang, speak, ui]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setState("idle");
  }, []);

  const swap = () => {
    setDirection((current) => (current === "ar-en" ? "en-ar" : "ar-en"));
    setHeard("");
    setResult("");
    setError("");
  };

  return (
    <>
      <button
        className="voice-fab"
        onClick={() => setOpen(true)}
        aria-label={ui.open}
        title={ui.open}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z"
          />
        </svg>
      </button>

      {open && (
        <div className="voice-panel" role="dialog" aria-modal="true" aria-label={ui.title}>
          <button className="voice-backdrop" aria-label={ui.close} onClick={() => setOpen(false)} />
          <div className="voice-card">
            <div className="voice-head">
              <strong>{ui.title}</strong>
              <button onClick={() => setOpen(false)} aria-label={ui.close}>
                ×
              </button>
            </div>

            {!supported ? (
              <p className="voice-error">{ui.notSupported}</p>
            ) : (
              <>
                <button className="voice-direction" onClick={swap}>
                  <span>{direction === "ar-en" ? ui.arToEn : ui.enToAr}</span>
                  <b>⇄</b>
                </button>

                <button
                  className={state === "listening" ? "voice-mic active" : "voice-mic"}
                  onClick={state === "listening" ? stop : start}
                  disabled={state === "translating"}
                >
                  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z"
                    />
                  </svg>
                </button>

                <p className="voice-state">
                  {state === "listening"
                    ? ui.listening
                    : state === "translating"
                      ? ui.translating
                      : ui.tapToTalk}
                </p>

                {heard && (
                  <div className="voice-line">
                    <small>{ui.youSaid}</small>
                    <p dir={fromLang === "ar" ? "rtl" : "ltr"}>{heard}</p>
                  </div>
                )}

                {result && (
                  <div className="voice-line result">
                    <small>{ui.translation}</small>
                    <p dir={toLang === "ar" ? "rtl" : "ltr"}>{result}</p>
                    <button className="voice-replay" onClick={() => speak(result, toLang)}>
                      🔊 {ui.speak}
                    </button>
                  </div>
                )}

                {error && <p className="voice-error">{error}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
