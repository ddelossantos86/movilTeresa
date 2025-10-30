import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect, G, Text as SvgText, Polygon } from 'react-native-svg';

interface TeresaLogoProps {
  size?: number;
}

export default function TeresaLogo({ size = 100 }: TeresaLogoProps) {
  return (
    <Svg width={size * 2.5} height={size} viewBox="0 0 400 160" fill="none">
      <Defs>
        <LinearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#667EEA" />
          <Stop offset="50%" stopColor="#764BA2" />
          <Stop offset="100%" stopColor="#F093FB" />
        </LinearGradient>
        <LinearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#2E3A59" />
          <Stop offset="100%" stopColor="#1A1F36" />
        </LinearGradient>
      </Defs>
      
      {/* Elementos decorativos Memphis flotantes */}
      <Circle cx="50" cy="40" r="12" fill="#F093FB" opacity="0.4" />
      <Rect x="90" y="25" width="20" height="20" fill="#667EEA" opacity="0.3" transform="rotate(25 100 35)" />
      <Circle cx="350" cy="130" r="15" fill="#764BA2" opacity="0.3" />
      <Polygon points="370,40 380,55 360,55" fill="#2E3A59" opacity="0.4" />
      
      {/* Círculo principal más grande con capas */}
      <Circle cx="75" cy="80" r="50" fill="url(#mainGrad)" opacity="0.2" />
      <Circle cx="75" cy="80" r="42" fill="url(#mainGrad)" />
      
      {/* T con estilo moderno */}
      <G>
        <Rect x="55" y="65" width="40" height="8" rx="4" fill="#FFFFFF" />
        <Rect x="71" y="65" width="8" height="38" rx="4" fill="#FFFFFF" />
        <Circle cx="75" cy="108" r="3" fill="#FFFFFF" />
      </G>
      
      {/* Pequeñas formas cerca del círculo */}
      <Rect x="25" y="95" width="12" height="12" fill="url(#accentGrad)" transform="rotate(-20 31 101)" />
      <Circle cx="115" cy="60" r="6" fill="#F093FB" />
      
      {/* Texto TERESA con estilo bold */}
      <SvgText
        x="145"
        y="90"
        fontSize="62"
        fontWeight="800"
        fill="#1A1F36"
        letterSpacing="-2"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont"
      >
        TERESA
      </SvgText>
      
      {/* Líneas decorativas múltiples */}
      <Rect x="145" y="100" width="90" height="4" rx="2" fill="url(#mainGrad)" />
      <Rect x="240" y="100" width="60" height="4" rx="2" fill="url(#accentGrad)" />
      
      {/* Detalles finales */}
      <Circle cx="310" cy="75" r="8" fill="#764BA2" opacity="0.5" />
      <Rect x="330" y="95" width="18" height="18" fill="#667EEA" opacity="0.4" transform="rotate(45 339 104)" />
    </Svg>
  );
}
