import { Image } from 'expo-image';
import { useState } from 'react';
import { Text } from 'react-native';

interface Props {
  source: number;
  fallback: string;
  size?: number;
  tintColor?: string;
}

export default function IconImage({ source, fallback, size = 28, tintColor }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Text style={{ fontSize: size }}>{fallback}</Text>;
  }
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      tintColor={tintColor}
      onError={() => setFailed(true)}
      contentFit="contain"
    />
  );
}
