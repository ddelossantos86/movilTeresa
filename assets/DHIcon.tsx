import React, { useEffect, useState } from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, G, Path, Text, Line } from 'react-native-svg';
import { Animated, Easing } from 'react-native';

interface DHIconProps {
  size?: number;
  animated?: boolean;
}

export default function DHIcon({ size = 56, animated = true }: DHIconProps) {
  const [rotation, useState] = React.useState(new Animated.Value(0));

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 360,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [animated, rotation]);

  const rotationInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotationInterpolate }] }}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          {/* Gradiente radial brillante para el fondo */}
          <LinearGradient id="dhGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#764BA2" />
            <Stop offset="50%" stopColor="#A6708B" />
            <Stop offset="100%" stopColor="#F093FB" />
          </LinearGradient>

          {/* Gradiente para el texto DH - efecto neón */}
          <LinearGradient id="dhGradText" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="50%" stopColor="#F093FB" />
            <Stop offset="100%" stopColor="#764BA2" />
          </LinearGradient>

          {/* Gradiente metálico para los bordes */}
          <LinearGradient id="dhGradMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" />
            <Stop offset="50%" stopColor="#FFA500" />
            <Stop offset="100%" stopColor="#FF69B4" />
          </LinearGradient>
        </Defs>

        {/* Fondo circular con efecto de profundidad */}
        <Circle cx="60" cy="60" r="56" fill="url(#dhGradBg)" opacity="0.3" />
        <Circle cx="60" cy="60" r="54" fill="url(#dhGradMetal)" />
        <Circle cx="60" cy="60" r="50" fill="url(#dhGradBg)" />

        {/* Círculo interior blanco con sombra */}
        <Circle cx="60" cy="60" r="48" fill="#FFFFFF" opacity="0.98" />

        {/* Líneas de energía decorativas */}
        <G opacity="0.15">
          <Line x1="60" y1="15" x2="60" y2="30" stroke="#764BA2" strokeWidth="2" strokeLinecap="round" />
          <Line x1="60" y1="90" x2="60" y2="105" stroke="#764BA2" strokeWidth="2" strokeLinecap="round" />
          <Line x1="15" y1="60" x2="30" y2="60" stroke="#F093FB" strokeWidth="2" strokeLinecap="round" />
          <Line x1="90" y1="60" x2="105" y2="60" stroke="#F093FB" strokeWidth="2" strokeLinecap="round" />
        </G>

        {/* Texto DH estilizado - Futurista y audaz */}
        <G>
          {/* Efecto de sombra suave */}
          <Text
            x="60"
            y="75"
            fontSize="48"
            fontWeight="900"
            fill="url(#dhGradText)"
            textAnchor="middle"
            fontFamily="Arial"
            letterSpacing="2"
          >
            DH
          </Text>

          {/* Línea decorativa bajo DH */}
          <Path
            d="M 35 78 Q 60 82 85 78"
            stroke="url(#dhGradMetal)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </G>

        {/* Puntos decorativos en las esquinas (efecto tech) */}
        <G fill="#764BA2" opacity="0.6">
          <Circle cx="30" cy="30" r="2" />
          <Circle cx="90" cy="30" r="2" />
          <Circle cx="30" cy="90" r="2" />
          <Circle cx="90" cy="90" r="2" />
        </G>

        {/* Borde externo sutil */}
        <Circle cx="60" cy="60" r="48" fill="none" stroke="url(#dhGradMetal)" strokeWidth="0.5" opacity="0.5" />
      </Svg>
    </Animated.View>
  );
}
