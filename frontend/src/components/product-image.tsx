import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { getProductImageUrls, normalizeImageUrl } from "../utils/productImage";

interface ProductImageProps {
  product?: any;
  urls?: string[];
  style: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  placeholderTextStyle?: StyleProp<TextStyle>;
  placeholderText?: string;
}

export default function ProductImage({
  product,
  urls,
  style,
  placeholderStyle,
  placeholderTextStyle,
  placeholderText = "No image",
}: ProductImageProps) {
  const candidates = useMemo(
    () =>
      [
        ...getProductImageUrls(product),
        ...(urls || []).map(normalizeImageUrl).filter(Boolean),
      ].filter((url, index, all) => all.indexOf(url) === index),
    [product, urls]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates.join("|")]);

  const uri = candidates[candidateIndex];

  if (!uri) {
    return (
      <View style={placeholderStyle}>
        <Text style={placeholderTextStyle}>{placeholderText}</Text>
      </View>
    );
  }

  return (
    <Image
      key={uri}
      source={{ uri }}
      style={style}
      resizeMode="contain"
      onError={() => setCandidateIndex((index) => index + 1)}
    />
  );
}
