const fs = require('fs');

// Crear SVG monocromático de 192x192 (tamaño recomendado para notificaciones)
const size = 192;
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Barra horizontal de la T -->
  <rect x="${size * 0.25}" y="${size * 0.30}" width="${size * 0.50}" height="${size * 0.10}" rx="${size * 0.05}" fill="white"/>
  
  <!-- Barra vertical de la T -->
  <rect x="${size * 0.46}" y="${size * 0.30}" width="${size * 0.08}" height="${size * 0.45}" rx="${size * 0.04}" fill="white"/>
  
  <!-- Punto decorativo -->
  <circle cx="${size * 0.50}" cy="${size * 0.80}" r="${size * 0.04}" fill="white"/>
</svg>`;

// Guardar como SVG
fs.writeFileSync('./assets/notification-icon.svg', svg);

console.log('✅ Ícono SVG creado: assets/notification-icon.svg');
console.log('   Tamaño: 192x192 pixels');
console.log('   Formato: SVG monocromático blanco sobre transparente');
console.log('');
console.log('📝 Para convertir a PNG, usa uno de estos métodos:');
console.log('   1. npx sharp-cli resize 192 192 -i assets/notification-icon.svg -o assets/notification-icon.png');
console.log('   2. Online: https://cloudconvert.com/svg-to-png');
console.log('   3. macOS: Abre el SVG en Preview y exporta como PNG');
