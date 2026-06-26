import { Platform } from "react-native";

type SpeechOptions = {
  enabled: boolean;
  onEnd?: () => void;
};

const hindiSignalWords = [
  "hai",
  "hain",
  "haan",
  "nahi",
  "nahin",
  "kya",
  "kaise",
  "kyu",
  "kyun",
  "mujhe",
  "aap",
  "apna",
  "karo",
  "karna",
  "khana",
  "pani",
  "doodh",
  "namak",
  "chini",
  "sehat",
  "achha",
  "bura",
  "mat",
  "wala",
  "wali",
  "ke",
  "ki",
  "ka",
];

function detectSpeechLanguage(text: string) {
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) return "hi-IN";

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const hindiWordCount = words.filter((word) => hindiSignalWords.includes(word)).length;
  if (hindiWordCount >= 2) return "hi-IN";

  return "en-IN";
}

function pickVoice(lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;

  const voices = window.speechSynthesis.getVoices();
  const normalizedLang = lang.toLowerCase();
  const baseLang = normalizedLang.split("-")[0];

  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLang) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${baseLang}-`)) ||
    voices.find((voice) => voice.lang.toLowerCase().includes(baseLang))
  );
}

export function speakAutoLanguage(text: string, options: SpeechOptions) {
  if (
    !options.enabled ||
    Platform.OS !== "web" ||
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    options.onEnd?.();
    return;
  }

  const lang = detectSpeechLanguage(text);

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = lang === "hi-IN" ? 0.92 : 1;
  utterance.voice = pickVoice(lang) || null;
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
  }
}
