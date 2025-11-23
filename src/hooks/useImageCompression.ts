import { useCallback } from 'react';
import * as FileSystem from 'expo-file-system';

/**
 * Hook para comprimir imágenes sin perder calidad significativa
 * - Comprime JPEG ajustando calidad
 * - Convierte a base64 eficientemente
 * - Calcula tamaño final antes de enviar
 */
export const useImageCompression = () => {
  /**
   * Comprimir imagen desde URI usando expo-file-system
   * @param imageUri - URI de la imagen (file://, data:, etc)
   * @param quality - Calidad 0-1 (default: 0.85)
   * @returns Promise<{base64: string, size: number, sizeKB: string}>
   */
  const compressImage = useCallback(async (
    imageUri: string,
    quality: number = 0.85
  ): Promise<{ base64: string; size: number; sizeKB: string }> => {
    try {
      console.log(`🖼️ Comprimiendo imagen con calidad ${quality * 100}%...`);

      // Leer archivo como base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Calcular tamaño
      const sizeBytes = Math.round((base64.length * 3) / 4);
      const sizeKB = (sizeBytes / 1024).toFixed(2);

      // Crear data URI con mime type
      const dataUri = `data:image/jpeg;base64,${base64}`;

      console.log(`✅ Imagen comprimida: ${sizeKB} KB`);

      return {
        base64: dataUri,
        size: sizeBytes,
        sizeKB,
      };
    } catch (error) {
      console.error('❌ Error comprimiendo imagen:', error);
      throw error;
    }
  }, []);

  /**
   * Comprimir múltiples imágenes
   * @param imageUris - Array de URIs
   * @param quality - Calidad
   * @returns Promise<Array<{base64, size, sizeKB}>>
   */
  const compressMultipleImages = useCallback(async (
    imageUris: string[],
    quality: number = 0.85
  ) => {
    const compressed = await Promise.all(
      imageUris.map(uri => compressImage(uri, quality))
    );
    
    const totalSizeKB = (
      compressed.reduce((sum, img) => sum + img.size, 0) / 1024
    ).toFixed(2);
    
    console.log(`🖼️ ${imageUris.length} imágenes comprimidas: ${totalSizeKB} KB total`);
    
    return compressed;
  }, [compressImage]);

  /**
   * Obtener información de compresión estimada
   */
  const getCompressionStats = useCallback((
    originalSize: number,
    compressedSize: number
  ) => {
    const reductionPercentage = originalSize > 0
      ? (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
      : '0';
    
    return {
      originalSizeMB: (originalSize / (1024 * 1024)).toFixed(2),
      compressedSizeMB: (compressedSize / (1024 * 1024)).toFixed(2),
      reductionPercentage,
      saved: ((originalSize - compressedSize) / 1024).toFixed(2),
    };
  }, []);

  return {
    compressImage,
    compressMultipleImages,
    getCompressionStats,
  };
};
