const sharp = require('sharp');
const fs = require('fs');

// SVG del icono Teresa - Igual al componente TeresaLogoIcon.tsx
const iconSVG = `
<svg width="1024" height="1024" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#667EEA" />
      <stop offset="50%" stop-color="#764BA2" />
      <stop offset="100%" stop-color="#F093FB" />
    </linearGradient>
  </defs>
  
  <!-- Círculo con gradiente -->
  <circle cx="50" cy="50" r="48" fill="url(#iconGrad)" />
  <circle cx="50" cy="50" r="48" stroke="#FFFFFF" stroke-width="3" fill="none" />
  
  <!-- T con estilo moderno centrada -->
  <g>
    <!-- Barra horizontal de la T -->
    <rect x="30" y="35" width="40" height="8" rx="4" fill="#FFFFFF" />
    <!-- Barra vertical de la T -->
    <rect x="46" y="35" width="8" height="38" rx="4" fill="#FFFFFF" />
    <!-- Punto decorativo -->
    <circle cx="50" cy="78" r="3" fill="#FFFFFF" />
  </g>
</svg>
`;

// SVG del adaptive icon (sin círculo exterior para el foreground)
const adaptiveIconSVG = `
<svg width="1024" height="1024" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#667EEA" />
      <stop offset="50%" stop-color="#764BA2" />
      <stop offset="100%" stop-color="#F093FB" />
    </linearGradient>
  </defs>
  
  <!-- Círculo con gradiente -->
  <circle cx="50" cy="50" r="45" fill="url(#iconGrad)" />
  
  <!-- T con estilo moderno centrada -->
  <g>
    <!-- Barra horizontal de la T -->
    <rect x="30" y="35" width="40" height="8" rx="4" fill="#FFFFFF" />
    <!-- Barra vertical de la T -->
    <rect x="46" y="35" width="8" height="38" rx="4" fill="#FFFFFF" />
    <!-- Punto decorativo -->
    <circle cx="50" cy="78" r="3" fill="#FFFFFF" />
  </g>
</svg>
`;

async function generateIcons() {
  console.log('🎨 Generando iconos de Teresa Colegio...\n');

  try {
    // Generar icon.png (1024x1024)
    await sharp(Buffer.from(iconSVG))
      .resize(1024, 1024)
      .png()
      .toFile('./assets/icon.png');
    console.log('✅ icon.png generado (1024x1024)');

    // Generar adaptive-icon.png (1024x1024)
    await sharp(Buffer.from(adaptiveIconSVG))
      .resize(1024, 1024)
      .png()
      .toFile('./assets/adaptive-icon.png');
    console.log('✅ adaptive-icon.png generado (1024x1024)');

    // Generar favicon.png (48x48)
    await sharp(Buffer.from(iconSVG))
      .resize(48, 48)
      .png()
      .toFile('./assets/favicon.png');
    console.log('✅ favicon.png generado (48x48)');

    console.log('\n🎉 ¡Iconos generados exitosamente!');
    console.log('📱 Los iconos ahora muestran el logo de Teresa con gradiente violeta-rosa');
  } catch (error) {
    console.error('❌ Error al generar iconos:', error);
    process.exit(1);
  }
}

generateIcons();
