import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";

interface HomeScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { width } = Dimensions.get("window");

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🥷</Text>
        <Text style={styles.headerTitle}>Nutri Ninja</Text>
        <Text style={styles.headerSubtitle}>Smart Food Analysis</Text>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Make Healthier Food Choices</Text>
          <Text style={styles.heroText}>
            Scan any packaged food barcode and get instant nutrition insights powered by AI
          </Text>
        </View>
      </View>

      {/* Main CTA Button */}
      <TouchableOpacity style={styles.ctaButton} onPress={() => onNavigate?.("scanner")}>
        <Text style={styles.ctaIcon}>📷</Text>
        <Text style={styles.ctaText}>Scan Barcode Now</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryCtaButton} onPress={() => onNavigate?.("explore")}>
        <Text style={styles.secondaryCtaText}>Open Nutrition Dashboard</Text>
      </TouchableOpacity>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Key Features</Text>

        <FeatureCard
          icon="📊"
          title="Health Score"
          description="Get AI-calculated 1-100 healthiness rating"
        />

        <FeatureCard
          icon="🏷️"
          title="Nutri-Score"
          description="Visual A-E grade for quick reference"
        />

        <FeatureCard
          icon="⚠️"
          title="Smart Warnings"
          description="Alerts for high sugar, salt, and fat content"
        />

        <FeatureCard
          icon="💚"
          title="Better Alternatives"
          description="Find healthier similar products instantly"
        />

        <FeatureCard
          icon="🚫"
          title="Avoid Unhealthy"
          description="See worst similar foods to stay aware"
        />

        <FeatureCard
          icon="🧬"
          title="Full Nutrition Data"
          description="Complete breakdown of all nutrients"
        />
      </View>

      {/* How It Works */}
      <View style={styles.howSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>

        <StepCard step="1" title="Scan" description="Point camera at any food barcode" />
        <StepCard step="2" title="Analyze" description="AI analyzes nutritional content" />
        <StepCard
          step="3"
          title="Get Insights"
          description="Receive health score & recommendations"
        />
        <StepCard
          step="4"
          title="Choose Better"
          description="Make informed food decisions"
        />
      </View>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>Why Nutri Ninja?</Text>

        <BenefitItem emoji="⚡" text="Instant analysis - results in seconds" />
        <BenefitItem emoji="🎯" text="Personalized health insights" />
        <BenefitItem emoji="📱" text="Works offline - no internet needed" />
        <BenefitItem emoji="🌍" text="Supports 100,000+ products" />
        <BenefitItem emoji="🔐" text="Your data stays private" />
      </View>

      {/* Footer CTA */}
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>Ready to make healthier choices?</Text>
        <TouchableOpacity style={styles.startButton} onPress={() => onNavigate?.("scanner")}>
          <Text style={styles.startButtonText}>Start Scanning →</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
      <Text style={styles.featureArrow}>›</Text>
    </View>
  );
}

interface StepCardProps {
  step: string;
  title: string;
  description: string;
}

function StepCard({ step, title, description }: StepCardProps) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{step}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

interface BenefitItemProps {
  emoji: string;
  text: string;
}

function BenefitItem({ emoji, text }: BenefitItemProps) {
  return (
    <View style={styles.benefitItem}>
      <Text style={styles.benefitEmoji}>{emoji}</Text>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1419",
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f26",
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#76FF03",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#999",
  },
  heroSection: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: "rgba(118, 255, 3, 0.05)",
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#76FF03",
  },
  heroContent: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  heroText: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: "row",
    backgroundColor: "#76FF03",
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  ctaIcon: {
    fontSize: 24,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  secondaryCtaButton: {
    borderColor: "#76FF03",
    borderWidth: 1,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  secondaryCtaText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#76FF03",
  },
  featuresSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: "#1a1f26",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: "#999",
  },
  featureArrow: {
    fontSize: 24,
    color: "#76FF03",
  },
  howSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  stepCard: {
    flexDirection: "row",
    backgroundColor: "#1a1f26",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#76FF03",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: "#999",
  },
  benefitsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  benefitEmoji: {
    fontSize: 24,
  },
  benefitText: {
    fontSize: 14,
    color: "#ccc",
    flex: 1,
  },
  footerSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  startButton: {
    backgroundColor: "#76FF03",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
});
