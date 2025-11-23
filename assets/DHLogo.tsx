import React from 'react';
import Svg, { Rect, Path, Text as SvgText } from 'react-native-svg';

interface DHLogoProps {
  size?: number;
  showText?: boolean;
}

const VIEW_WIDTH = 220;
const VIEW_HEIGHT = 120;

export default function DHLogo({ size = 100, showText = true }: DHLogoProps) {
  const width = size * 2.2;
  const height = size * 1.1;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} fill="none">
      <Rect width={VIEW_WIDTH} height={VIEW_HEIGHT} rx={24} fill="#111827" />

      <Path
        d="M62 30h18c21 0 34 14 34 30s-13 30-34 30H62V30zm18 44c10 0 16-5 16-14s-6-14-16-14h-6v28h6z"
        fill="#F3F4F6"
      />
      <Rect x={133} y={30} width={18} height={60} fill="#F3F4F6" rx={2} />
      <Rect x={165} y={30} width={18} height={60} fill="#F3F4F6" rx={2} />

      {showText && (
        <SvgText
          x={VIEW_WIDTH / 2}
          y={106}
          fill="#9CA3AF"
          fontSize={14}
          letterSpacing={6}
          textAnchor="middle"
          fontFamily="Inter, 'Helvetica Neue', Arial"
        >
          COLEGIOS
        </SvgText>
      )}
    </Svg>
  );
}
