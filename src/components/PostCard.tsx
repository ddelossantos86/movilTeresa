import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Icon } from '@ui-kitten/components';

const { width: screenWidth } = Dimensions.get('window');
const POST_WIDTH = Math.min(screenWidth - 20, 600);

interface PostCardProps {
  id?: string;
  titulo?: string;
  contenido?: string;
  autorNombre?: string;
  fecha?: string | Date;
  imagenes?: string[];
  imagen?: string;
  alumnoNombre?: string;
  alumnoApellido?: string;
  alcance?: string;
  tipoMensaje?: 'GENERAL' | 'ACADEMICO' | 'ADMINISTRATIVO' | 'EVENTO' | 'CONSULTA_TUTOR' | 'NOTA';
  tipo?: 'MENSAJE' | 'ASISTENCIA' | 'EVALUACION' | 'SEGUIMIENTO';
  totalReacciones?: number;
  miReaccion?: boolean;
  onReaccion?: (tipo: string) => void;
  onExpandir?: () => void;
  onVerDetalles?: () => void;
  isDarkMode?: boolean;
  metadata?: {
    tipo_notificacion?: 'NOTA' | 'ASISTENCIA' | 'SEGUIMIENTO' | 'FORMATIVA';
    alumnoId?: string;
    [key: string]: any;
  };
  onNavigateToSection?: (section: 'Mensajes' | 'Calificaciones' | 'Asistencia' | 'Seguimientos' | 'Evaluaciones') => void;
}

const formatDate = (date: any) => {
  if (!date) return 'Sin fecha';
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const PostCard: React.FC<PostCardProps> = ({
  id,
  titulo,
  contenido,
  autorNombre,
  fecha,
  imagenes,
  imagen,
  alumnoNombre,
  alumnoApellido,
  alcance,
  tipoMensaje,
  tipo,
  totalReacciones,
  miReaccion,
  onReaccion,
  onExpandir,
  onVerDetalles,
  isDarkMode = false,
  metadata,
  onNavigateToSection
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedContent, setExpandedContent] = useState(false);
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({});
  const flatListRef = useRef<FlatList>(null);
  
  // Colores según modo oscuro
  const COLORS = isDarkMode ? {
    bg_primary: '#0F0F1E',
    bg_secondary: '#222841',
    bg_tertiary: '#2A3154',
    text_primary: '#FFFFFF',
    text_secondary: '#D0D0D0',
    text_tertiary: '#A0A0B0',
    border_subtle: '#3A3F5F',
    accent_rose: '#F093FB',
    accent_primary: '#764BA2',
  } : {
    bg_primary: '#FFFFFF',
    bg_secondary: '#F8FAFB',
    bg_tertiary: '#EFF3F6',
    text_primary: '#1A1F36',
    text_secondary: '#666666',
    text_tertiary: '#999999',
    border_subtle: '#e5e7eb',
    accent_rose: '#F093FB',
    accent_primary: '#764BA2',
  };

  // Detectar si es una notificación
  const isNotificacion = !!metadata?.tipo_notificacion;
  const tipoNotificacion = metadata?.tipo_notificacion;
  
  // Mapeo de tipos de notificación a secciones y etiquetas
  const notificacionConfig = {
    'NOTA': { seccion: 'Calificaciones' as const, label: 'Nueva Calificación', emoji: '📚' },
    'ASISTENCIA': { seccion: 'Asistencia' as const, label: 'Registro de Asistencia', emoji: '✅' },
    'SEGUIMIENTO': { seccion: 'Seguimientos' as const, label: 'Nuevo Seguimiento', emoji: '📝' },
    'FORMATIVA': { seccion: 'Evaluaciones' as const, label: 'Evaluación Formativa', emoji: '📊' }
  };
  
  const configNotif = tipoNotificacion ? notificacionConfig[tipoNotificacion] : null;

  // Mapeo de alcance a etiquetas
  const getAlcanceLabel = (alcanceValue?: string) => {
    const labels: any = {
      COLEGIO: 'Todos',
      GRADO: 'Curso',
      DIVISION: 'División',
      ALUMNO: 'Alumno',
    };
    return alcanceValue ? labels[alcanceValue] || alcanceValue : null;
  };

  // Formatear tipo de mensaje sin guiones bajos
  const formatTipoMensaje = (tipo?: string) => {
    if (!tipo) return '';
    const labels: any = {
      GENERAL: 'General',
      ACADEMICO: 'Académico',
      ADMINISTRATIVO: 'Administrativo',
      EVENTO: 'Evento',
      CONSULTA_TUTOR: 'Consulta Tutor',
      ANUNCIO_GENERAL: 'ANUNCIO GENERAL',
      NOTA: 'Nota',
    };
    return labels[tipo] || tipo;
  };

  // Usar imagenes si existen, sino usar imagen única
  const todasLasImagenes = (imagenes && imagenes.length > 0) ? imagenes : imagen ? [imagen] : [];

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / POST_WIDTH);
    setCurrentImageIndex(Math.min(index, todasLasImagenes.length - 1));
  };

  // Determinar si el contenido necesita truncarse
  const MAX_CHARS = 100;

  return (
    <View style={[
      styles.container,
      isNotificacion && styles.containerNotificacion,
      {
        backgroundColor: COLORS.bg_primary,
        borderColor: COLORS.border_subtle
      }
    ]}>
      {/* Notificación Badge - Top */}
      {isNotificacion && configNotif && (
        <View style={styles.notificacionBadge}>
          <Text style={styles.notificacionEmoji}>{configNotif.emoji}</Text>
          <Text style={styles.notificacionLabel}>{configNotif.label}</Text>
        </View>
      )}

      {/* Header - Author & Date SIN AVATAR */}
      <View style={styles.headerSimple}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.authorName, { color: COLORS.text_primary }]} numberOfLines={1}>
            {alumnoNombre && alumnoApellido
              ? `${alumnoNombre.charAt(0).toUpperCase() + alumnoNombre.slice(1)} ${alumnoApellido.charAt(0).toUpperCase() + alumnoApellido.slice(1)}`
              : (autorNombre ? autorNombre.charAt(0).toUpperCase() + autorNombre.slice(1) : 'Usuario')}
          </Text>
          <View style={styles.metaContainer}>
            {/* Tipo de Mensaje (GENERAL, ACADEMICO, etc.) */}
            {tipoMensaje && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: 
                  tipoMensaje === 'GENERAL' ? '#E6F7FF' :
                  tipoMensaje === 'ACADEMICO' ? '#F0E6FF' :
                  tipoMensaje === 'ADMINISTRATIVO' ? '#FFE6E6' :
                  tipoMensaje === 'EVENTO' ? '#E6FFE6' :
                  tipoMensaje === 'ANUNCIO_GENERAL' ? '#FFF9E6' :
                  tipoMensaje === 'CONSULTA_TUTOR' ? '#FFF3E6' :
                  '#FFF9E6',
                borderRadius: 8,
                alignSelf: 'flex-start'
              }}>
                <Text style={{ 
                  color: 
                    tipoMensaje === 'GENERAL' ? '#0369A1' :
                    tipoMensaje === 'ACADEMICO' ? '#6D28D9' :
                    tipoMensaje === 'ADMINISTRATIVO' ? '#B91C1C' :
                    tipoMensaje === 'EVENTO' ? '#764BA2' :
                    tipoMensaje === 'ANUNCIO_GENERAL' ? '#A67C00' :
                    tipoMensaje === 'CONSULTA_TUTOR' ? '#EA580C' :
                    '#A67C00',
                  fontWeight: '600', 
                  fontSize: 9,
                  textTransform: 'uppercase'
                }}>
                  {formatTipoMensaje(tipoMensaje)}
                </Text>
              </View>
            )}
            
            {alcance && (
              <Text style={[
                styles.alcanceLabel,
                {
                  color: alcance === 'ALUMNO' ? '#718096' : COLORS.accent_rose,
                  backgroundColor: alcance === 'ALUMNO' ? '#EDF2F7' : (isDarkMode ? '#3A3F5F' : '#FEE6F8'),
                  textTransform: 'uppercase'
                }
              ]}>{getAlcanceLabel(alcance)}</Text>
            )}
            
            <Text style={[styles.fecha, { color: COLORS.text_tertiary }]}>{formatDate(fecha)}</Text>
            {tipo && !tipoMensaje && (
              <Text style={[
                styles.tipoLabel,
                {
                  color: tipo === 'MENSAJE' ? '#0369A1' : 
                         tipo === 'ASISTENCIA' ? '#16A34A' :
                         tipo === 'EVALUACION' ? '#7C3AED' :
                         tipo === 'SEGUIMIENTO' ? '#EA580C' : '#666',
                  backgroundColor: tipo === 'MENSAJE' ? '#E0F2FE' : 
                                  tipo === 'ASISTENCIA' ? '#DCFCE7' :
                                  tipo === 'EVALUACION' ? '#F3E8FF' :
                                  tipo === 'SEGUIMIENTO' ? '#FFEDD5' : '#F3F4F6'
                }
              ]}>
                {tipo === 'MENSAJE' ? '📧' : 
                 tipo === 'ASISTENCIA' ? '✓' :
                 tipo === 'EVALUACION' ? '📊' :
                 tipo === 'SEGUIMIENTO' ? '📝' : '•'} {tipo}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Carousel Fullscreen de Imágenes */}
      {todasLasImagenes.length > 0 && (
        <View style={styles.imageSection}>
          {/* FlatList Horizontal para Carrusel */}
          <FlatList
            ref={flatListRef}
            data={todasLasImagenes}
            horizontal
            pagingEnabled
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <View style={[styles.imageSlide, { width: POST_WIDTH }]}>
                {loadingImages[index] && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#764BA2" />
                  </View>
                )}
                <Image
                  source={{ uri: item }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                  onLoadStart={() => setLoadingImages(prev => ({ ...prev, [index]: true }))}
                  onLoadEnd={() => setLoadingImages(prev => ({ ...prev, [index]: false }))}
                />
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
            style={styles.carousel}
          />

          {/* Image Counter - Top Right */}
          {todasLasImagenes.length > 1 && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {currentImageIndex + 1}/{todasLasImagenes.length}
              </Text>
            </View>
          )}

          {/* Dots Indicator - Bottom */}
          {todasLasImagenes.length > 1 && (
            <View style={styles.dotsContainer}>
              {todasLasImagenes.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentImageIndex === index && [
                      styles.dotActive,
                      { backgroundColor: COLORS.accent_rose }
                    ]
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Título + Botón Me Gusta en la misma línea */}
      {titulo && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, marginBottom: 12, gap: 8 }}>
          <Text style={[styles.titulo, { color: COLORS.text_primary, flex: 1 }]} numberOfLines={2}>
            {titulo}
          </Text>
          <TouchableOpacity 
            style={[
              styles.reactionButtonHeader,
              miReaccion && styles.reactionButtonActive
            ]}
            onPress={() => onReaccion && onReaccion('CORAZON')}
            activeOpacity={0.7}
          >
            <Text style={styles.reactionEmojiHeader}>{miReaccion ? '❤️' : '🤍'}</Text>
            {totalReacciones > 0 && (
              <Text style={[styles.reactionCountHeader, miReaccion && styles.reactionCountActive]}>
                {totalReacciones}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Contenido con Expandible */}
      {contenido && (
        <View>
          <Text 
            style={[styles.contenido, { color: COLORS.text_secondary, textAlign: 'justify' }]}
            numberOfLines={expandedContent ? undefined : 2}
          >
            {contenido}
          </Text>
          {!expandedContent && contenido.length > 100 && (
            <TouchableOpacity onPress={() => setExpandedContent(true)}>
              <Text style={[styles.moreButton, { color: COLORS.accent_rose }]}>más</Text>
            </TouchableOpacity>
          )}
          {expandedContent && contenido.length > 100 && (
            <TouchableOpacity onPress={() => setExpandedContent(false)}>
              <Text style={[styles.moreButton, { color: COLORS.accent_rose }]}>menos</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Barra de Reacciones */}
      <View style={[styles.reactionBar, { backgroundColor: COLORS.bg_secondary, borderTopColor: COLORS.border_subtle }]}>
        {/* Reacciones deshabilitadas temporalmente */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  containerNotificacion: {
    borderWidth: 2,
    borderColor: '#FFB020',
    backgroundColor: '#FFFBF0',
  },
  notificacionBadge: {
    backgroundColor: '#FFB020',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificacionEmoji: {
    fontSize: 16,
  },
  notificacionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSimple: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  fecha: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  alcanceLabel: {
    fontSize: 9,
    color: '#F093FB',
    backgroundColor: '#FEE6F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'uppercase'
  },
  tipoLabel: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    paddingHorizontal: 12,
    marginBottom: 8,
    lineHeight: 20,
  },
  contenido: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  moreButton: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F093FB',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 12,
    position: 'relative',
  },
  carousel: {
    width: POST_WIDTH,
    height: 300,
  },
  imageSlide: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 10,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  counterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E0',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F093FB',
  },
  reactionBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reactionButtonActive: {
    backgroundColor: '#FFE8EE',
    borderColor: '#FF3D71',
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  reactionCountActive: {
    color: '#FF3D71',
  },
  navigationButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFB020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reactionButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reactionEmojiHeader: {
    fontSize: 16,
  },
  reactionCountHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
  },
});
