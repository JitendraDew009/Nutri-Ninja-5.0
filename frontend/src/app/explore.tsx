import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useThemeMode } from "../utils/themeMode";

const defaultResponses = [
  { sender: "assistant", text: "Hi! I can help with food scores, ingredient checks, and basket guidance." },
  { sender: "assistant", text: "Ask me what to avoid, what to add, or start a live chat below." },
];

export default function ExploreScreen() {
  const { mode, palette } = useThemeMode();
  const [voiceQuestion, setVoiceQuestion] = useState("Is this product healthy?");
  const [voiceAnswer, setVoiceAnswer] = useState("");
  const [chatText, setChatText] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string }>>(defaultResponses);

  const answerVoiceQuestion = (question = voiceQuestion) => {
    if (!question.trim()) {
      setVoiceAnswer("Type or ask a question to get nutrition guidance.");
      return;
    }

    const lower = question.toLowerCase();
    if (lower.includes("healthy") || lower.includes("score")) {
      setVoiceAnswer("For a healthy choice, look for low sugar, high fiber, and balanced protein. Scan a product to get a score.");
      return;
    }

    if (lower.includes("avoid")) {
      setVoiceAnswer("Avoid products high in added sugar, saturated fat, and artificial additives when possible.");
      return;
    }

    setVoiceAnswer("I recommend scanning the product or asking about calories, allergens, or dietary goals.");
  };

  const startVoiceInput = () => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      answerVoiceQuestion();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceAnswer("Voice input is not available in this browser. Please type your question instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || voiceQuestion;
      setVoiceQuestion(transcript);
      answerVoiceQuestion(transcript);
    };
    recognition.onerror = () => setVoiceAnswer("I couldn't understand that. Try speaking clearly or type your question.");
    recognition.start();
  };

  const sendChatMessage = () => {
    if (!chatText.trim()) return;
    const nextMessages = [...chatMessages, { sender: "user", text: chatText.trim() }];
    setChatMessages(nextMessages);
    setChatText("");
    setTimeout(() => {
      setChatMessages((messages) => [
        ...messages,
        {
          sender: "assistant",
          text: `You said: "${chatText.trim()}". Our live assistant will respond with product-specific guidance once available.`,
        },
      ]);
    }, 600);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>Voice & Live Chat</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Ask the nutrition assistant by voice or chat with our live help desk.</Text>
        </View>

        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.panelTitle, { color: palette.text }]}>Voice Assistant</Text>
          <TextInput
            style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
            value={voiceQuestion}
            onChangeText={setVoiceQuestion}
            placeholder="Ask a food question"
            placeholderTextColor={mode === "day" ? "#7b8794" : "#8c9bb3"}
          />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.primaryButton, styles.flex, { backgroundColor: palette.accentBright }]} onPress={startVoiceInput}>
              <Text style={styles.primaryButtonText}>Ask by Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButtonInline, styles.flex]} onPress={() => answerVoiceQuestion()}>
              <Text style={styles.secondaryButtonText}>Get Answer</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.answerBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}> 
            <Text style={[styles.answerText, { color: palette.text }]}>{voiceAnswer || "Your answer will appear here."}</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.panelTitle, { color: palette.text }]}>Live Chat</Text>
          <View style={styles.chatWindow}>
            {chatMessages.map((message, index) => (
              <View
                key={`${message.sender}-${index}`}
                style={[
                  styles.chatBubble,
                  message.sender === "assistant" ? styles.chatAssistant : styles.chatUser,
                ]}
              >
                <Text style={[styles.chatText, { color: message.sender === "assistant" ? palette.text : "#000" }]}>{message.text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.chatInput, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
              value={chatText}
              onChangeText={setChatText}
              placeholder="Start a live chat message"
              placeholderTextColor={mode === "day" ? "#7b8794" : "#8c9bb3"}
            />
            <TouchableOpacity style={[styles.primaryButton, styles.chatButton]} onPress={sendChatMessage}>
              <Text style={styles.primaryButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  header: { marginBottom: 18 },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  panel: { borderRadius: 20, borderWidth: 1, marginBottom: 16, padding: 18 },
  panelTitle: { fontSize: 18, fontWeight: "900", marginBottom: 14 },
  input: { borderRadius: 16, borderWidth: 1, fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  primaryButton: { alignItems: "center", borderRadius: 16, paddingVertical: 14 },
  primaryButtonText: { color: "#000", fontSize: 14, fontWeight: "900" },
  secondaryButtonInline: { alignItems: "center", borderColor: "#76FF03", borderRadius: 16, borderWidth: 1, paddingVertical: 14 },
  secondaryButtonText: { color: "#76FF03", fontSize: 14, fontWeight: "900" },
  answerBox: { borderRadius: 16, borderWidth: 1, marginTop: 14, padding: 14 },
  answerText: { fontSize: 14, lineHeight: 20 },
  chatWindow: { maxHeight: 320, marginBottom: 14 },
  chatBubble: { borderRadius: 16, marginBottom: 10, padding: 12 },
  chatAssistant: { backgroundColor: "rgba(118, 255, 3, 0.1)" },
  chatUser: { backgroundColor: "#d1d5db", alignSelf: "flex-end" },
  chatText: { fontSize: 14, lineHeight: 20 },
  chatInput: { borderRadius: 16, borderWidth: 1, flex: 1, fontSize: 14, paddingHorizontal: 14, paddingVertical: 12 },
  chatButton: { borderRadius: 16, paddingHorizontal: 18 },
});
