import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, G, Path, Line } from 'react-native-svg';

interface DHIconV3Props {
  size?: number;
}

export default function DHIconV3({ size = 56 }: DHIconV3Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Defs>
        {/* Gradiente elegante y minimalista */}
        <LinearGradient id="dhGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#667EEA" />
          <Stop offset="100%" stopColor="#764BA2" />
        </LinearGradient>

        {/* Gradiente para acentos */}
        <LinearGradient id="dhAccent3" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F093FB" />
          <Stop offset="100%" stopColor="#FF8FAB" />
        </LinearGradient>
      </Defs>

      {/* Fondo con cuadrado rotado (minimalista) */}
      <Rect x="20" y="20" width="80" height="80" rx="16" fill="url(#dhGrad3)" transform="rotate(0 60 60)" />

      {/* Overlay con patrón */}
      <Circle cx="60" cy="60" r="40" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.2" />
      <Circle cx="60" cy="60" r="30" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.15" />

      {/* Contenedor interior blanco */}
      <Rect x="28" y="28" width="64" height="64" rx="12" fill="#FFFFFF" opacity="0.98" />

      {/* Líneas decorativas - efecto de velocidad */}
      <G stroke="url(#dhAccent3)" strokeWidth="2" opacity="0.4">
        <Line x1="35" y1="60" x2="45" y2="60" strokeLinecap="round" />
        <Line x1="75" y1="60" x2="85" y2="60" strokeLinecap="round" />
      </G>

      {/* Letras DH - Ultra minimalistas y geométricas */}
      <G>
        {/* D - Forma simple y moderna */}
        <Rect x="36" y="45" width="5" height="30" rx="2.5" fill="url(#dhGrad3)" />
        <Path
          d="M 41 45 Q 52 52 52 60 Q 52 68 41 75"
          fill="none"
          stroke="url(#dhGrad3)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Separador elegante */}
        <Rect x="58" y="50" width="1.5" height="20" fill="url(#dhAccent3)" opacity="0.5" />

        {/* H - Forma simple y moderna */}
        <Rect x="66" y="45" width="5" height="30" rx="2.5" fill="url(#dhGrad3)" />
        <Rect x="66" y="57" width="20" height="4" rx="2" fill="url(#dhGrad3)" />
        <Rect x="83" y="45" width="5" height="30" rx="2.5" fill="url(#dhGrad3)" />
      </G>

      {/* Puntos de énfasis minimalistas */}
      <G fill="url(#dhAccent3)" opacity="0.5">
        <Circle cx="35" cy="40" r="1.5" />
        <Circle cx="85" cy="40" r="1.5" />
        <Circle cx="35" cy="80" r="1.5" />
        <Circle cx="85" cy="80" r="1.5" />
      </G>

      {/* Borde sutil */}
      <Rect x="28" y="28" width="64" height="64" rx="12" fill="none" stroke="url(#dhAccent3)" strokeWidth="0.5" opacity="0.3" />
    </Svg>
  );
}
