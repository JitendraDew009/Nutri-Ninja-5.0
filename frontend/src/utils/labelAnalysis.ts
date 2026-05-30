export type LabelFinding = {
  title: string;
  detail: string;
  severity: "good" | "info" | "warning" | "danger";
};

const dangerTerms = [
  "high fructose corn syrup",
  "hydrogenated",
  "partially hydrogenated",
  "palm oil",
  "msg",
  "monosodium glutamate",
  "sodium benzoate",
  "tartrazine",
  "aspartame",
];

const sugarTerms = ["sugar", "glucose", "fructose", "dextrose", "maltose", "sucrose", "jaggery", "corn syrup"];
const saltTerms = ["salt", "sodium", "baking soda", "sodium chloride"];
const proteinTerms = ["protein", "milk solids", "soy protein", "whey", "peanut", "chana", "lentil"];
const fiberTerms = ["whole wheat", "oats", "millet", "ragi", "jowar", "bran", "fiber", "fibre"];

function includesAny(text: string, terms: string[]) {
  return terms.filter((term) => text.includes(term));
}

export function analyzeLabelText(rawText: string, allergies = ""): LabelFinding[] {
  const text = rawText.toLowerCase();
  const findings: LabelFinding[] = [];

  if (!text.trim()) {
    return [];
  }

  const dangerHits = includesAny(text, dangerTerms);
  if (dangerHits.length) {
    findings.push({
      title: "Additive caution",
      detail: `Found ${dangerHits.slice(0, 3).join(", ")}.`,
      severity: "danger",
    });
  }

  const sugarHits = includesAny(text, sugarTerms);
  if (sugarHits.length) {
    findings.push({
      title: "Sugar sources found",
      detail: `Detected ${Array.from(new Set(sugarHits)).slice(0, 4).join(", ")}.`,
      severity: "warning",
    });
  }

  const saltHits = includesAny(text, saltTerms);
  if (saltHits.length) {
    findings.push({
      title: "Salt or sodium found",
      detail: `Detected ${Array.from(new Set(saltHits)).slice(0, 3).join(", ")}.`,
      severity: "warning",
    });
  }

  const fiberHits = includesAny(text, fiberTerms);
  if (fiberHits.length) {
    findings.push({
      title: "Fiber-friendly ingredients",
      detail: `Found ${Array.from(new Set(fiberHits)).slice(0, 3).join(", ")}.`,
      severity: "good",
    });
  }

  const proteinHits = includesAny(text, proteinTerms);
  if (proteinHits.length) {
    findings.push({
      title: "Protein ingredients",
      detail: `Found ${Array.from(new Set(proteinHits)).slice(0, 3).join(", ")}.`,
      severity: "good",
    });
  }

  const allergyHits = allergies
    .toLowerCase()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => text.includes(item));

  if (allergyHits.length) {
    findings.unshift({
      title: "Allergy alert",
      detail: `Matches your allergy list: ${allergyHits.join(", ")}.`,
      severity: "danger",
    });
  }

  if (!findings.length) {
    findings.push({
      title: "No major flags",
      detail: "No common sugar, sodium, additive, or allergy terms were detected.",
      severity: "info",
    });
  }

  return findings;
}

export function labelHealthEstimate(findings: LabelFinding[]) {
  let score = 75;
  findings.forEach((finding) => {
    if (finding.severity === "danger") score -= 22;
    if (finding.severity === "warning") score -= 12;
    if (finding.severity === "good") score += 8;
  });

  return Math.max(1, Math.min(100, score));
}
