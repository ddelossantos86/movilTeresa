import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, G } from 'react-native-svg';

interface TeresaLogoIconProps {
  size?: number;
}

export default function TeresaLogoIcon({ size = 42 }: TeresaLogoIconProps) {
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
      <Circle cx="50" cy="50" r="48" stroke="#FFFFFF" strokeWidth="3" fill="none" />
      
      {/* T con estilo moderno centrada */}
      <G>
        {/* Barra horizontal de la T */}
        <Rect x="30" y="35" width="40" height="8" rx="4" fill="#FFFFFF" />
        {/* Barra vertical de la T */}
        <Rect x="46" y="35" width="8" height="38" rx="4" fill="#FFFFFF" />
        {/* Punto decorativo */}
        <Circle cx="50" cy="78" r="3" fill="#FFFFFF" />
      </G>
    </Svg>
  );
}
