import React, { useEffect, useState } from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, G, Path, Line, Polygon } from 'react-native-svg';
import { Animated, Easing } from 'react-native';

interface AcademicLogoProps {
  size?: number;
  animated?: boolean;
}

export default function AcademicLogo({ size = 56, animated = true }: AcademicLogoProps) {
  const [rotation, setRotation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 360,
          duration: 25000,
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
          {/* Gradiente académico - azul y dorado */}
          <LinearGradient id="academicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1E40AF" />
            <Stop offset="50%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#0369A1" />
          </LinearGradient>

          {/* Gradiente para acentos dorados */}
          <LinearGradient id="academicGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FCD34D" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>

          {/* Gradiente para decoraciones */}
          <LinearGradient id="academicAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#06B6D4" />
            <Stop offset="100%" stopColor="#0EA5E9" />
          </LinearGradient>
        </Defs>

        {/* Fondo circular principal */}
        <Circle cx="60" cy="60" r="56" fill="url(#academicGrad)" />
        <Circle cx="60" cy="60" r="54" fill="#FFFFFF" opacity="0.95" />

        {/* Anillo decorativo - corona académica */}
        <Circle cx="60" cy="60" r="50" fill="none" stroke="url(#academicGold)" strokeWidth="1.5" opacity="0.6" />

        {/* Birrete (mortarboard) - parte superior */}
        <G>
          {/* Base del birrete */}
          <Rect x="35" y="30" width="50" height="3" rx="1.5" fill="url(#academicGrad)" />
          
          {/* Cilindro del birrete */}
          <Rect x="48" y="25" width="24" height="8" rx="2" fill="url(#academicGrad)" />
          
          {/* Tassel (borla) colgante */}
          <Line x1="60" y1="33" x2="60" y2="45" stroke="url(#academicGold)" strokeWidth="2" strokeLinecap="round" />
          <Circle cx="60" cy="47" r="2.5" fill="url(#academicGold)" />
        </G>

        {/* Libro abierto - símbolo central */}
        <G>
          {/* Lomo del libro */}
          <Rect x="50" y="50" width="20" height="25" rx="2" fill="url(#academicGrad)" opacity="0.8" />
          
          {/* Página izquierda */}
          <Path
            d="M 50 50 L 48 50 L 48 75 L 50 75 Z"
            fill="url(#academicAccent)"
            opacity="0.7"
          />
          
          {/* Página derecha */}
          <Path
            d="M 70 50 L 72 50 L 72 75 L 70 75 Z"
            fill="url(#academicAccent)"
            opacity="0.7"
          />
          
          {/* Líneas de texto en el libro */}
          <G stroke="#FFFFFF" strokeWidth="1" opacity="0.6">
            <Line x1="52" y1="58" x2="68" y2="58" strokeLinecap="round" />
            <Line x1="52" y1="63" x2="68" y2="63" strokeLinecap="round" />
            <Line x1="52" y1="68" x2="65" y2="68" strokeLinecap="round" />
          </G>
        </G>

        {/* Estrellas decorativas - excelencia académica */}
        <G fill="url(#academicGold)" opacity="0.5">
          {/* Estrella superior izquierda */}
          <Circle cx="32" cy="35" r="2" />
          {/* Estrella superior derecha */}
          <Circle cx="88" cy="35" r="2" />
          {/* Estrella inferior izquierda */}
          <Circle cx="28" cy="82" r="2" />
          {/* Estrella inferior derecha */}
          <Circle cx="92" cy="82" r="2" />
        </G>

        {/* Líneas de conocimiento/energía */}
        <G stroke="url(#academicAccent)" strokeWidth="0.8" opacity="0.3">
          <Line x1="60" y1="15" x2="60" y2="25" strokeLinecap="round" />
          <Line x1="60" y1="95" x2="60" y2="105" strokeLinecap="round" />
          <Line x1="15" y1="60" x2="25" y2="60" strokeLinecap="round" />
          <Line x1="95" y1="60" x2="105" y2="60" strokeLinecap="round" />
        </G>

        {/* Borde exterior sutil */}
        <Circle cx="60" cy="60" r="54" fill="none" stroke="url(#academicGold)" strokeWidth="0.5" opacity="0.4" />
      </Svg>
    </Animated.View>
  );
}
