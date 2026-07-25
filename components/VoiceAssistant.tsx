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
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal: boolean }
        >;
      }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

const LABELS = {
  ar: {
    open: "الترجمة الحية",
    subtitles: "ترجمة حية",
    arToEn: "عربي ← إنجليزي",
    enToAr: "إنجليزي ← عربي",
    start: "ابدأ الترجمة",
    stop: "إيقاف",
    swap: "بدّل",
    listening: "بستمع…",
    waiting: "اتكلم وهتظهر الترجمة هنا",
    micDenied: "لازم تسمح باستخدام المايك",
    notSupported: "المتصفح مش بيدعم التعرف على الصوت. جرّب Chrome أو Safari.",
  },
  en: {
    open: "Live translation",
    subtitles: "Live translation",
    arToEn: "Arabic → English",
    enToAr: "English → Arabic",
    start: "Start translating",
    stop: "Stop",
    swap: "Swap",
    listening: "Listening…",
    waiting: "Speak and the translation appears here",
    micDenied: "Please allow microphone access",
    notSupported: "This browser doesn't support speech recognition. Try Chrome or Safari.",
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

  const [active, setActive] = useState(false);
  const [direction, setDirection] = useState<Direction>("ar-en");
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");
  const [heard, setHeard] = useState("");
  const [translated, setTranslated] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeRef = useRef(false);
  const directionRef = useRef<Direction>(direction);

  // Keep the ref in sync so async recognition callbacks read the latest direction.
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const toLang = direction === "ar-en" ? "en" : "ar";

  const getSR = () =>
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
      .SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!getSR()) setSupported(false);
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const start = useCallback(() => {
    const SR = getSR();
    if (!SR) {
      setSupported(false);
      return;
    }
    setError("");
    setHeard("");
    setTranslated("");

    const recognition = new SR();
    const [from] = directionRef.current === "ar-en" ? ["ar", "en"] : ["en", "ar"];
    recognition.lang = from === "ar" ? "ar-EG" : "en-US";
    recognition.continuous = true; // keep listening like film subtitles
    recognition.interimResults = true; // show words as they are spoken
    recognitionRef.current = recognition;

    recognition.onresult = async (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i];
        const transcript = chunk[0]?.transcript || "";
        if (chunk.isFinal) finalText += transcript;
        else interimText += transcript;
      }

      if (interimText) setHeard(interimText);

      if (finalText.trim()) {
        setHeard(finalText.trim());
        const [f, t] = directionRef.current === "ar-en" ? ["ar", "en"] : ["en", "ar"];
        try {
          const result = await translate(finalText.trim(), f, t);
          setTranslated(result);
        } catch {
          /* keep the last good translation on a transient failure */
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError(ui.micDenied);
        stop();
      }
      // "no-speech" and similar are transient — onend will restart.
    };

    recognition.onend = () => {
      // Chrome stops after a pause; restart while the user keeps it active.
      if (activeRef.current) {
        try {
          recognition.start();
        } catch {
          /* ignore double-start */
        }
      }
    };

    try {
      recognition.start();
      activeRef.current = true;
      setActive(true);
    } catch {
      setError(ui.micDenied);
    }
  }, [stop, ui]);

  // Restart cleanly when the direction changes mid-session.
  const swap = () => {
    const next: Direction = direction === "ar-en" ? "en-ar" : "ar-en";
    setDirection(next);
    setHeard("");
    setTranslated("");
    if (activeRef.current) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      // onend won't restart because we null the ref; kick off fresh shortly.
      activeRef.current = false;
      setActive(false);
      setTimeout(() => start(), 150);
    }
  };

  useEffect(() => () => stop(), [stop]);

  return (
    <>
      <button
        className={active ? "voice-fab active" : "voice-fab"}
        onClick={active ? stop : start}
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

      {active && (
        <div className="subtitle-bar" role="status" aria-live="polite">
          <div className="subtitle-controls">
            <button className="subtitle-swap" onClick={swap}>
              {direction === "ar-en" ? ui.arToEn : ui.enToAr} <b>⇄</b>
            </button>
            <button className="subtitle-stop" onClick={stop} aria-label={ui.stop}>
              ×
            </button>
          </div>
          <div className="subtitle-text">
            {translated ? (
              <p className="subtitle-translated" dir={toLang === "ar" ? "rtl" : "ltr"}>
                {translated}
              </p>
            ) : (
              <p className="subtitle-waiting">{heard || ui.waiting}</p>
            )}
          </div>
        </div>
      )}

      {error && active && <div className="subtitle-error">{error}</div>}
      {!supported && (
        <div className="subtitle-error subtitle-error-static">{ui.notSupported}</div>
      )}
    </>
  );
}
