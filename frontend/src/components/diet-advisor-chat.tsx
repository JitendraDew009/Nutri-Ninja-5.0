import React, { useEffect, useRef, useState } from "react";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ChatMessage, sendChatMessage } from "../services/api";
import { getActiveProfile } from "../utils/localStore";
import { cancelSpeech, speakAutoLanguage } from "../utils/speech";
import { useThemeMode } from "../utils/themeMode";

interface DietAdvisorChatProps {
  product: any;
  ingredientText?: string;
  healthScore: number;
  nutriScore: string;
}

function buildProductContext(
  product: any,
  ingredientText: string | undefined,
  healthScore: number,
  nutriScore: string
) {
  return [
    `Product: ${product.product_name || "Unknown"}`,
    `Brand: ${product.brands || "Unknown"}`,
    `Barcode: ${product.code || "N/A"}`,
    ingredientText ? `Ingredients: ${ingredientText}` : null,
    `Ninja Health Score: ${healthScore}`,
    `Nutri-Score: ${nutriScore}`,
  ]
    .filter(Boolean)
    .join(". ");
}

export default function DietAdvisorChat({
  product,
  ingredientText,
  healthScore,
  nutriScore,
}: DietAdvisorChatProps) {
  const { palette } = useThemeMode();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const productContext = buildProductContext(product, ingredientText, healthScore, nutriScore);

  useEffect(() => {
    setMessages([]);
    setDraft("");
    setLoading(false);
  }, [product.code]);

  const speak = (text: string) => {
    speakAutoLanguage(text, { enabled: voiceReplies });
  };

  const toggleVoiceReplies = () => {
    setVoiceReplies((enabled) => {
      const nextEnabled = !enabled;
      if (!nextEnabled) cancelSpeech();
      return nextEnabled;
    });
  };

  const submitMessage = async (text = draft) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage: ChatMessage = { role: "user", content };
    const nextMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setLoading(true);

    try {
      const profile = getActiveProfile();
      const apiMessages: ChatMessage[] =
        messages.length === 0
          ? [
              {
                role: "user",
                content: `[Scanned product context: ${productContext}]\n\nUser question: ${content}`,
              },
            ]
          : nextMessages;

      const answer = await sendChatMessage(apiMessages, profile);
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
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

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: palette.accentBright }]}>
          <SymbolView
            name={{ ios: "bubble.left.and.bubble.right.fill", android: "forum", web: "forum" }}
            tintColor={palette.onAccent}
            size={22}
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: palette.text }]}>Diet Advisor Live Chat</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Ask about sweetener safety, macros...</Text>
        </View>
        <TouchableOpacity
          style={[styles.soundButton, { backgroundColor: palette.surfaceInset }]}
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
            size={20}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.chatBox, { backgroundColor: palette.surfaceInset, borderColor: palette.border }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={[
            styles.chatContent,
            !messages.length && !loading && styles.chatContentEmpty,
          ]}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          nestedScrollEnabled
        >
          {!messages.length && !loading ? (
            <Text style={[styles.emptyText, { color: palette.muted }]}>
              No doubts yet. Ask, e.g., &apos;Is the sweetener used here safe for weight loss?&apos;
            </Text>
          ) : (
            messages.map((message, index) => {
              const assistant = message.role === "assistant";
              return (
                <View
                  key={`${message.role}-${index}`}
                  style={[
                    styles.bubble,
                    assistant
                      ? [styles.assistantBubble, { backgroundColor: palette.surfaceSoft }]
                      : [styles.userBubble, { backgroundColor: palette.accentBright }],
                  ]}
                >
                  <Text
                    style={[
                      styles.message,
                      { color: assistant ? palette.text : palette.onAccent },
                      !assistant && styles.userText,
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              );
            })
          )}
          {loading ? (
            <View style={styles.thinking}>
              <ActivityIndicator color={palette.accentBright} size="small" />
              <Text style={[styles.thinkingText, { color: palette.muted }]}>Nutri Ninja is thinking...</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.composer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: palette.surfaceInset,
              borderColor: palette.border,
              color: palette.text,
            },
          ]}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => submitMessage()}
          placeholder="Ask your nutrition query..."
          placeholderTextColor={palette.muted}
          returnKeyType="send"
          editable={!loading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: palette.accentBright },
            (!draft.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={() => submitMessage()}
          disabled={loading || !draft.trim()}
        >
          <SymbolView
            name={{ ios: "paperplane.fill", android: "send", web: "send" }}
            tintColor={palette.onAccent}
            size={20}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
    padding: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  headerIcon: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 17, fontWeight: "900" },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  soundButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  chatBox: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    minHeight: 180,
  },
  chatScroll: { maxHeight: 220 },
  chatContent: { padding: 14 },
  chatContentEmpty: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 152,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  bubble: {
    borderRadius: 14,
    marginBottom: 10,
    maxWidth: "92%",
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  message: { fontSize: 14, lineHeight: 21 },
  userText: { fontWeight: "600" },
  thinking: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
  },
  thinkingText: { fontSize: 12 },
  composer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
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
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  sendButtonDisabled: { opacity: 0.45 },
});
