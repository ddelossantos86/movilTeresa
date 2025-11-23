import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, G, Path, Polygon, Ellipse } from 'react-native-svg';

interface DHIconV2Props {
  size?: number;
}

export default function DHIconV2({ size = 56 }: DHIconV2Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Defs>
        {/* Gradiente moderno en 3D */}
        <LinearGradient id="dhGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B6B" />
          <Stop offset="50%" stopColor="#764BA2" />
          <Stop offset="100%" stopColor="#4ECDC4" />
        </LinearGradient>

        {/* Gradiente para texto en vidrio */}
        <LinearGradient id="dhGradText" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#E0E0E0" />
        </LinearGradient>

        {/* Gradiente acento brillante */}
        <LinearGradient id="dhGradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFD93D" />
          <Stop offset="100%" stopColor="#FF6B9D" />
        </LinearGradient>
      </Defs>

      {/* Fondo principal con efecto de cristal */}
      <Circle cx="60" cy="60" r="56" fill="url(#dhGradBg)" />

      {/* Capa de vidrio esmerilado */}
      <Circle cx="60" cy="60" r="54" fill="#FFFFFF" opacity="0.08" />

      {/* Formas geométricas modernas de fondo */}
      <G opacity="0.2">
        {/* Triángulo superior */}
        <Polygon points="60,20 100,50 20,50" fill="#FFFFFF" />
        
        {/* Cuadrado inferior rotado */}
        <Rect x="35" y="65" width="50" height="50" rx="8" fill="#FFFFFF" transform="rotate(45 60 90)" />
      </G>

      {/* Círculo interior con gradiente oscuro */}
      <Circle cx="60" cy="60" r="48" fill="#FFFFFF" opacity="0.95" />

      {/* Patrón hexagonal sutil */}
      <G stroke="url(#dhGradAccent)" strokeWidth="0.5" fill="none" opacity="0.3">
        <Circle cx="60" cy="60" r="20" />
        <Circle cx="60" cy="60" r="30" />
        <Circle cx="60" cy="60" r="40" />
      </G>

      {/* Letras DH en estilo geométrico moderno */}
      <G>
        {/* D - Forma geométrica */}
        <Rect x="28" y="42" width="8" height="36" rx="2" fill="url(#dhGradText)" />
        <Path
          d="M 36 42 Q 50 42 50 60 Q 50 78 36 78"
          fill="none"
          stroke="url(#dhGradText)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Línea separadora accent */}
        <Rect x="58" y="50" width="2" height="20" fill="url(#dhGradAccent)" opacity="0.7" />

        {/* H - Forma geométrica */}
        <Rect x="68" y="42" width="8" height="36" rx="2" fill="url(#dhGradText)" />
        <Rect x="68" y="57" width="24" height="6" rx="3" fill="url(#dhGradText)" />
        <Rect x="84" y="42" width="8" height="36" rx="2" fill="url(#dhGradText)" />
      </G>

      {/* Detalles decorativos - puntos pulsantes */}
      <G fill="url(#dhGradAccent)" opacity="0.6">
        <Circle cx="25" cy="25" r="2.5" />
        <Circle cx="95" cy="25" r="2.5" />
        <Circle cx="25" cy="95" r="2.5" />
        <Circle cx="95" cy="95" r="2.5" />
      </G>

      {/* Borde exterior con efecto de luz */}
      <Circle cx="60" cy="60" r="48" fill="none" stroke="url(#dhGradAccent)" strokeWidth="1" opacity="0.4" />
      
      {/* Reflejo superior de luz */}
      <Ellipse cx="45" cy="35" rx="12" ry="8" fill="#FFFFFF" opacity="0.15" />
    </Svg>
  );
}
