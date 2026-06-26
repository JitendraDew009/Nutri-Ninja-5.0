import React, { useEffect, useRef, useState } from "react";
import { SymbolView } from "expo-symbols";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ChatMessage, sendChatMessage, sendVoiceMessage } from "../services/api";
import { getActiveProfile } from "../utils/localStore";
import { cancelSpeech, speakAutoLanguage } from "../utils/speech";
import { useThemeMode } from "../utils/themeMode";

const welcome: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! I'm your Nutri Ninja assistant. Ask about ingredients, food labels, healthier swaps, or your grocery basket.",
  },
];

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

export default function ExploreScreen() {
  const { palette } = useThemeMode();
  const [messages, setMessages] = useState<ChatMessage[]>(welcome);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [voiceMode, setVoiceMode] = useState<"idle" | "live" | "recording">("idle");
  const scrollRef = useRef<ScrollView | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef("");
  const voiceRepliesRef = useRef(false);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      cancelSpeech();
    };
  }, []);

  const setSpokenReplies = (enabled: boolean) => {
    voiceRepliesRef.current = enabled;
    setVoiceReplies(enabled);
    if (!enabled) cancelSpeech();
  };

  const speak = (text: string) => {
    speakAutoLanguage(text, { enabled: voiceRepliesRef.current });
  };

  const toggleVoiceReplies = () => {
    setVoiceReplies((enabled) => {
      const nextEnabled = !enabled;
      voiceRepliesRef.current = nextEnabled;
      if (!nextEnabled) cancelSpeech();
      return nextEnabled;
    });
  };

  const submitMessage = async (text = draft) => {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setDraft("");
    setLiveTranscript("");
    transcriptRef.current = "";
    setLoading(true);

    try {
      const profile = getActiveProfile();
      const answer = await sendChatMessage(nextMessages, profile);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: answer },
      ]);
      speak(answer);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error?.message || "I couldn't answer just now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the voice recording."));
      reader.onloadend = () =>
        resolve(String(reader.result || "").split(",")[1] || "");
      reader.readAsDataURL(blob);
    });

  const submitVoiceMessage = async (blob: Blob) => {
    if (!blob.size) return;
    setLoading(true);
    setLiveTranscript("");
    setMessages((current) => [
      ...current,
      { role: "user", content: "Voice message" },
    ]);
    try {
      const profile = getActiveProfile();
      const audioBase64 = await blobToBase64(blob);
      const answer = await sendVoiceMessage(
        audioBase64,
        blob.type || "audio/webm",
        messages,
        profile
      );
      setMessages((current) => [
        ...current,
        { role: "assistant", content: answer },
      ]);
      speak(answer);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error?.message || "I couldn't process that voice message.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) return false;

    cancelSpeech();
    setSpokenReplies(true);
    setLiveTranscript("");

    const recognition = new SpeechRecognitionConstructor() as SpeechRecognitionLike;
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onstart = () => {
      setVoiceMode("live");
      setListening(true);
      setLiveTranscript("Listening...");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      finalTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = String(event.results[index]?.[0]?.transcript || "").trim();
        if (event.results[index]?.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const displayText = finalTranscript || interimTranscript;
      if (displayText) {
        transcriptRef.current = displayText;
        setLiveTranscript(displayText);
        setDraft(displayText);
      }
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      setVoiceMode("idle");
      const error = event?.error;
      const message =
        error === "not-allowed"
          ? "Microphone permission is blocked. Allow microphone access and try again."
          : error === "no-speech"
            ? "I could not hear clearly. Please tap the mic and speak again."
            : "Voice recognition could not start. Try again or type your question.";
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      setVoiceMode("idle");

      const content = (finalTranscript || transcriptRef.current).trim();
      if (content) {
        setTimeout(() => submitMessage(content), 50);
      } else {
        setLiveTranscript("");
        transcriptRef.current = "";
      }
    };

    recognition.start();
    return true;
  };

  const startVoiceChat = async () => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Voice chat is currently available in supported web browsers. You can still type here.",
        },
      ]);
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    if (listening && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }

    if (startSpeechRecognition()) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "This browser cannot record microphone audio. Try a current Chrome or Edge browser.",
        },
      ]);
      return;
    }

    try {
      cancelSpeech();
      setSpokenReplies(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: preferredType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setListening(false);
        setVoiceMode("idle");
        submitVoiceMessage(blob);
      };
      recorder.start();
      setVoiceMode("recording");
      setListening(true);
      setLiveTranscript("Recording audio... tap mic again to send.");
    } catch (error: any) {
      setListening(false);
      setVoiceMode("idle");
      const denied = error?.name === "NotAllowedError";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: denied
            ? "Microphone permission is blocked. Allow microphone access in the browser's site settings, then try again."
            : "The microphone could not start. Check that another app is not using it.",
        },
      ]);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: palette.text }]}>AI Nutrition Assistant</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            Tap mic and speak. I will listen, answer, and read it back.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.soundButton, { backgroundColor: palette.surfaceSoft }]}
          onPress={toggleVoiceReplies}
          accessibilityRole="button"
          accessibilityLabel={voiceReplies ? "Mute spoken replies" : "Enable spoken replies"}
        >
          <SymbolView
            name={{
              ios: voiceReplies ? "speaker.wave.2.fill" : "speaker.slash.fill",
              android: voiceReplies ? "volume_up" : "volume_off",
              web: voiceReplies ? "volume_up" : "volume_off",
            }}
            tintColor={voiceReplies ? palette.accentBright : palette.muted}
            size={22}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => {
          const assistant = message.role === "assistant";
          return (
            <View
              key={`${message.role}-${index}`}
              style={[
                styles.bubble,
                assistant ? styles.assistantBubble : styles.userBubble,
                {
                  backgroundColor: assistant ? palette.surface : palette.accentBright,
                  borderColor: assistant ? palette.border : palette.accentBright,
                },
              ]}
            >
              <Text style={[styles.message, { color: assistant ? palette.text : palette.onAccent }]}>
                {message.content}
              </Text>
            </View>
          );
        })}
        {loading ? (
          <View style={[styles.thinking, { backgroundColor: palette.surface }]}>
            <ActivityIndicator color={palette.accentBright} />
            <Text style={{ color: palette.muted }}>Nutri Ninja is thinking...</Text>
          </View>
        ) : null}
        {listening || liveTranscript ? (
          <View style={[styles.liveStatus, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={[styles.liveDot, { backgroundColor: listening ? palette.danger : palette.accentBright }]} />
            <Text style={[styles.liveStatusText, { color: palette.text }]}>
              {voiceMode === "recording" ? "Recording: " : voiceMode === "live" ? "Listening: " : ""}
              {liveTranscript || "Ready for voice chat"}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.composer, { backgroundColor: palette.header, borderColor: palette.border }]}>
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: listening ? palette.danger : palette.surfaceSoft },
          ]}
          onPress={startVoiceChat}
          disabled={loading}
        >
          <SymbolView
            name={{ ios: "mic.fill", android: "mic", web: "mic" }}
            tintColor={listening ? "#fff" : palette.accentBright}
            size={25}
          />
        </TouchableOpacity>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: palette.surfaceSoft,
              borderColor: palette.border,
              color: palette.text,
            },
          ]}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => submitMessage()}
          placeholder={listening ? "Recording... tap mic to send" : "Ask about nutrition or food"}
          placeholderTextColor={palette.muted}
          returnKeyType="send"
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: palette.accentBright }]}
          onPress={() => submitMessage()}
          disabled={loading || !draft.trim()}
        >
          <SymbolView
            name={{ ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" }}
            tintColor={palette.onAccent}
            size={23}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: 10,
  },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 4, maxWidth: 310 },
  soundButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  chat: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 24 },
  bubble: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    maxWidth: "86%",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  assistantBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 5 },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 5 },
  message: { fontSize: 14, lineHeight: 21 },
  thinking: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  liveStatus: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  liveDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  liveStatusText: { flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 19 },
  composer: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "web" ? 12 : 10,
  },
  micButton: {
    alignItems: "center",
    borderRadius: 22,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  input: {
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 16,
  },
  sendButton: {
    alignItems: "center",
    borderRadius: 22,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
});
