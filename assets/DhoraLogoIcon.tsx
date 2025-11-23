import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, G, Path } from 'react-native-svg';

interface DhoraLogoIconProps {
  size?: number;
}

export default function DhoraLogoIcon({ size = 56 }: DhoraLogoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#667EEA" />
          <Stop offset="50%" stopColor="#764BA2" />
          <Stop offset="100%" stopColor="#F093FB" />
        </LinearGradient>
      </Defs>
      
      {/* Círculo con gradiente */}
      <Circle cx="50" cy="50" r="48" fill="url(#iconGrad)" />
      
      {/* Círculo interior blanco más pequeño */}
      <Circle cx="50" cy="50" r="42" fill="#ffffff" opacity="0.95" />
      
      {/* D con estilo moderno */}
      <G>
        {/* Barra vertical izquierda */}
        <Rect x="35" y="30" width="6" height="40" rx="3" fill="#667EEA" />
        
        {/* Curva derecha (semicírculo) */}
        <Path
          d="M 41 30 Q 58 30 58 50 Q 58 70 41 70 L 41 30"
          fill="none"
          stroke="#667EEA"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
