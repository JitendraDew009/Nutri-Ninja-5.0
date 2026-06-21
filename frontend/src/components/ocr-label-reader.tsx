import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useThemeMode } from '../utils/themeMode';
import {
  parseIngredients,
  extractAllergens,
  assessIngredientHealth,
  type Ingredient,
  type AllergenInfo,
} from '../utils/ingredientParser';
import { extractTextFromBase64, cleanOCRText } from '../services/ocr';

interface OCRLabelReaderProps {
  onClose: () => void;
  onIngredientsExtracted?: (ingredients: Ingredient[], allergens: AllergenInfo[]) => void;
}

export default function OCRLabelReader({ onClose, onIngredientsExtracted }: OCRLabelReaderProps) {
  const { palette } = useThemeMode();
  const [ingredientText, setIngredientText] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allergens, setAllergens] = useState<AllergenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [healthAssessment, setHealthAssessment] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = async (file: File) => {
    setOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const base64 = (e.target.result as string).split(',')[1];
          const result = await extractTextFromBase64(base64, (progress) => {
            console.log('OCR Progress:', progress);
          });

          if (result.error) {
            alert(`OCR Error: ${result.error}`);
          } else {
            const cleanedText = cleanOCRText(result.text);
            setIngredientText(cleanedText);
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleParseIngredients = () => {
    if (!ingredientText.trim()) {
      alert('Please enter ingredient text or upload an image');
      return;
    }

    setLoading(true);
    try {
      const parsedIngredients = parseIngredients(ingredientText);
      const detectedAllergens = extractAllergens(parsedIngredients);
      const assessment = assessIngredientHealth(parsedIngredients);

      setIngredients(parsedIngredients);
      setAllergens(detectedAllergens);
      setHealthAssessment(assessment);

      onIngredientsExtracted?.(parsedIngredients, detectedAllergens);
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Camera access not available in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg').split(',')[1];
          handleImageUpload(new File([atob(imageData)], 'capture.jpg', { type: 'image/jpeg' }));
        }

        stream.getTracks().forEach((track) => track.stop());
      }, 1000);
    } catch (error) {
      alert('Camera access denied or unavailable');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>🔍 OCR Label Reader</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            Extract ingredients from food package labels
          </Text>
        </View>

        {/* Upload/Camera Section */}
        {!healthAssessment && (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Step 1: Capture or Upload</Text>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: palette.accentBright }]}
              onPress={handleTakePhoto}
              disabled={ocrLoading}
            >
              {ocrLoading ? (
                <ActivityIndicator color={palette.background} />
              ) : (
                <Text style={styles.buttonText}>📷 Take Photo</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: palette.accentBright, opacity: 0.8 }]}
              onPress={() => fileInputRef.current?.click()}
              disabled={ocrLoading}
            >
              <Text style={styles.buttonText}>📤 Upload Image</Text>
            </TouchableOpacity>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <View style={[styles.divider, { borderColor: palette.border }]} />

            <Text style={[styles.cardTitle, { color: palette.text, marginTop: 16 }]}>
              Step 2: Paste Ingredients Text
            </Text>

            <TextInput
              style={[styles.textInput, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
              placeholder="Paste or type ingredient list here..."
              placeholderTextColor={palette.muted}
              value={ingredientText}
              onChangeText={setIngredientText}
              multiline
              numberOfLines={6}
            />

            <TouchableOpacity
              style={[styles.analyzeButton, { backgroundColor: palette.accentBright }]}
              onPress={handleParseIngredients}
              disabled={loading || !ingredientText.trim()}
            >
              {loading ? (
                <ActivityIndicator color={palette.background} />
              ) : (
                <Text style={styles.buttonText}>✨ Analyze Ingredients</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Results Section */}
        {healthAssessment && (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: palette.text }]}>Analysis Results</Text>
              <TouchableOpacity onPress={() => setHealthAssessment(null)}>
                <Text style={[styles.resetText, { color: palette.accentBright }]}>← New Analysis</Text>
              </TouchableOpacity>
            </View>

            {/* Health Score */}
            <View style={[styles.scoreBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.scoreLabel, { color: palette.muted }]}>Ingredient Quality</Text>
              <Text style={[styles.scoreValue, { color: palette.accentBright }]}>{healthAssessment.score}%</Text>
              <Text style={[styles.scoreWarning, { color: palette.text }]}>{healthAssessment.warning}</Text>
            </View>

            {/* Key Details */}
            {healthAssessment.details.length > 0 && (
              <View style={styles.detailsBox}>
                <Text style={[styles.detailsTitle, { color: palette.text }]}>Notes:</Text>
                {healthAssessment.details.map((detail: string, index: number) => (
                  <Text key={index} style={[styles.detailItem, { color: palette.muted }]}>
                    • {detail}
                  </Text>
                ))}
              </View>
            )}

            {/* Allergens */}
            {allergens.length > 0 && (
              <View style={[styles.allergenBox, { backgroundColor: 'rgba(220,53,69,0.1)', borderColor: '#dc3545' }]}>
                <Text style={[styles.allergenTitle, { color: '#dc3545' }]}>⚠️ Allergens Detected</Text>
                {allergens.map((allergen, index) => (
                  <View key={index} style={styles.allergenItem}>
                    <Text style={[styles.allergenName, { color: '#dc3545' }]}>{allergen.name}</Text>
                    <Text style={[styles.allergenSeverity, { color: '#dc3545' }]}>
                      {allergen.severity.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Ingredients List */}
            <View style={styles.ingredientsSection}>
              <Text style={[styles.ingredientsTitle, { color: palette.text }]}>
                Identified Ingredients ({ingredients.length})
              </Text>
              <ScrollView nestedScrollEnabled style={styles.ingredientsList}>
                {ingredients.slice(0, 10).map((ingredient, index) => (
                  <View
                    key={index}
                    style={[
                      styles.ingredientItem,
                      {
                        backgroundColor: ingredient.isAllergen ? 'rgba(220,53,69,0.1)' : palette.surfaceSoft,
                        borderColor: ingredient.isAllergen ? '#dc3545' : palette.border,
                      },
                    ]}
                  >
                    <Text style={[styles.ingredientName, { color: palette.text }]}>
                      {ingredient.isAllergen ? '⚠️ ' : ''}
                      {ingredient.name}
                    </Text>
                    {ingredient.quantity && (
                      <Text style={[styles.ingredientQuantity, { color: palette.muted }]}>
                        {ingredient.quantity}
                        {ingredient.unit ? ` ${ingredient.unit}` : ''}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: palette.border }]}
          onPress={onClose}
        >
          <Text style={[styles.closeButtonText, { color: palette.text }]}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  divider: { height: 1, borderWidth: 1, marginVertical: 16 },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
    marginBottom: 12,
    fontSize: 14,
  },
  analyzeButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 18, fontWeight: '700' },
  resetText: { fontSize: 12, fontWeight: '600' },
  scoreBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: { fontSize: 12, fontWeight: '600' },
  scoreValue: { fontSize: 32, fontWeight: '900', marginVertical: 4 },
  scoreWarning: { fontSize: 13, fontWeight: '600' },
  detailsBox: { marginBottom: 16, paddingLeft: 12 },
  detailsTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  detailItem: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  allergenBox: { borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 16 },
  allergenTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  allergenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(220,53,69,0.2)',
  },
  allergenName: { fontSize: 13, fontWeight: '600', flex: 1 },
  allergenSeverity: { fontSize: 11, fontWeight: '700' },
  ingredientsSection: { marginBottom: 16 },
  ingredientsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  ingredientsList: { maxHeight: 200 },
  ingredientItem: { borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 8 },
  ingredientName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  ingredientQuantity: { fontSize: 12 },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: { fontWeight: '600', fontSize: 14 },
});
