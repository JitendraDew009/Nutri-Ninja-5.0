import React, { useRef, useState } from "react";
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
import { useThemeMode } from "../utils/themeMode";

const welcome: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! I'm your Nutri Ninja assistant. Ask about ingredients, food labels, healthier swaps, or your grocery basket.",
  },
];

export default function ExploreScreen() {
  const { mode, palette } = useThemeMode();
  const [messages, setMessages] = useState<ChatMessage[]>(welcome);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const scrollRef = useRef<ScrollView | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speak = (text: string) => {
    if (
      !voiceReplies ||
      Platform.OS !== "web" ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceReplies = () => {
    setVoiceReplies((enabled) => {
      const nextEnabled = !enabled;
      if (!nextEnabled && Platform.OS === "web" && typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
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

    if (listening && recorderRef.current) {
      recorderRef.current.stop();
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
      window.speechSynthesis?.cancel();
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
        submitVoiceMessage(blob);
      };
      recorder.start();
      setListening(true);
    } catch (error: any) {
      setListening(false);
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
      edges={["top"]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: palette.text }]}>AI Nutrition Assistant</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            Tap once to record, speak, then tap again to send.
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
              <Text style={[styles.message, { color: assistant ? palette.text : "#08110a" }]}>
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
      </ScrollView>

      <View style={[styles.composer, { backgroundColor: palette.header, borderColor: palette.border }]}>
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: listening ? "#ef4444" : palette.surfaceSoft },
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
          placeholderTextColor={mode === "day" ? "#7b8794" : "#8c9bb3"}
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
            tintColor="#071007"
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
