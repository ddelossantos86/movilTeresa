import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  StyleSheet
} from 'react-native';
import { Card, Divider, Icon, Button } from '@ui-kitten/components';

const { width: screenWidth } = Dimensions.get('window');

interface MensajeDetailCarouselProps {
  visible: boolean;
  onClose: () => void;
  titulo?: string;
  contenido?: string;
  imagenes?: string[];
  imagen?: string;
  autorNombre?: string;
  fecha?: string;
  tipo?: string;
  alcance?: string;
  isDarkMode?: boolean;
  onResponder?: () => void;
}

const formatDate = (date: any) => {
  if (!date) return 'Sin fecha';
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTipo = (tipo: string, autorNombre?: string) => {
  const tipos: Record<string, string> = {
    GENERAL: 'General',
    ACADEMICO: 'Académico',
    ADMINISTRATIVO: 'Administrativo',
    EVENTO: 'Evento',
    CONSULTA_TUTOR: 'Consulta'
  };
  return tipos[tipo] || tipo;
};

const getColorForTipo = (tipo: string) => {
  const colors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    GENERAL: { bg: '#E6F7FF', border: '#0095FF', icon: 'bell-outline', text: '#0369A1' },
    ACADEMICO: { bg: '#F0E6FF', border: '#8B5CF6', icon: 'book-outline', text: '#6D28D9' },
    ADMINISTRATIVO: { bg: '#FFE6E6', border: '#EF4444', icon: 'file-text-outline', text: '#B91C1C' },
    EVENTO: { bg: '#E6FFE6', border: '#10B981', icon: 'calendar-outline', text: '#047857' },
    CONSULTA_TUTOR: { bg: '#FFF3E6', border: '#EA580C', icon: 'message-circle-outline', text: '#EA580C' }
  };
  return colors[tipo] || { bg: '#FFF9E6', border: '#FFB020', icon: 'info-outline', text: '#A67C00' };
};

const getAlcanceLabel = (alcanceValue?: string) => {
  const labels: any = {
    COLEGIO: 'Todos',
    GRADO: 'Curso',
    DIVISION: 'División',
    ALUMNO: 'Personal',
  };
  return alcanceValue ? labels[alcanceValue] || alcanceValue : null;
};

export const MensajeDetailCarousel: React.FC<MensajeDetailCarouselProps> = ({
  visible,
  onClose,
  titulo,
  contenido,
  imagenes = [],
  imagen,
  autorNombre,
  fecha,
  tipo,
  alcance,
  isDarkMode = false,
  onResponder
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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
  } : {
    bg_primary: '#FFFFFF',
    bg_secondary: '#F8FAFB',
    bg_tertiary: '#EFF3F6',
    text_primary: '#1A1F36',
    text_secondary: '#666666',
    text_tertiary: '#999999',
    border_subtle: '#e5e7eb',
    accent_rose: '#F093FB',
  };

  // Usar imagenes si existen, sino usar imagen única
  const todasLasImagenes = (imagenes && imagenes.length > 0) ? imagenes : imagen ? [imagen] : [];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? todasLasImagenes.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === todasLasImagenes.length - 1 ? 0 : prev + 1
    );
  };

  const handleThumbnailPress = (index: number) => {
    setCurrentImageIndex(index);
  };

  const colors = tipo ? getColorForTipo(tipo) : { bg: '#FFF9E6', border: '#FFB020', icon: 'info-outline', text: '#A67C00' };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent={true}
      animationType="slide"
    >
      <View style={[styles.container, { backgroundColor: COLORS.bg_primary }]}>
        <Card style={[styles.card, { backgroundColor: COLORS.bg_primary, borderColor: COLORS.border_subtle }]}>
          <ScrollView style={[styles.scrollView, { backgroundColor: COLORS.bg_primary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: COLORS.bg_primary }]}>
              <View style={styles.headerContent}>
                <Text style={[styles.title, { color: COLORS.text_primary }]}>
                  {titulo || 'Sin título'}
                </Text>
                {autorNombre && (
                  <Text style={[styles.author, { color: COLORS.text_secondary }]}>
                    Por: <Text style={{ fontWeight: '700', color: COLORS.text_primary }}>{autorNombre}</Text>
                  </Text>
                )}
                {fecha && (
                  <Text style={[styles.date, { color: COLORS.text_tertiary }]}>
                    {formatDate(fecha)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close-outline" style={[styles.closeIcon, { fill: COLORS.text_primary }]} />
              </TouchableOpacity>
            </View>

            <Divider style={[styles.divider, { backgroundColor: COLORS.border_subtle }]} />

            {/* Type and Author badges */}
            <View style={styles.badgesContainer}>
              {tipo && (
                <View style={[
                  styles.badge,
                  isDarkMode
                    ? { backgroundColor: '#3A3F5F' }
                    : { backgroundColor: colors.bg }
                ]}>
                  <Icon
                    name={colors.icon}
                    style={[
                      styles.badgeIcon,
                      isDarkMode
                        ? { fill: COLORS.accent_rose }
                        : { fill: colors.border }
                    ]}
                  />
                  <Text style={[
                    styles.badgeText,
                    isDarkMode
                      ? { color: COLORS.accent_rose }
                      : { color: colors.text }
                  ]}>
                    {formatTipo(tipo, autorNombre)}
                  </Text>
                </View>
              )}
              {alcance && (
                <View style={[styles.badge, styles.alcanceBadge]}>
                  <Text style={styles.alcanceText}>
                    {getAlcanceLabel(alcance)}
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <Text style={styles.content}>
                {contenido || 'Sin contenido'}
              </Text>
            </View>

            {/* Images Carousel */}
            {todasLasImagenes.length > 0 && (
              <View style={styles.imagesSection}>
                <Text style={styles.imagesTitle}>
                  Imágenes ({currentImageIndex + 1} de {todasLasImagenes.length})
                </Text>

                {/* Main Image */}
                <View style={styles.mainImageContainer}>
                  {todasLasImagenes[currentImageIndex] && (
                    <Image
                      source={{ uri: todasLasImagenes[currentImageIndex] }}
                      style={styles.mainImage}
                      resizeMode="contain"
                    />
                  )}
                </View>

                {/* Navigation Buttons */}
                {todasLasImagenes.length > 1 && (
                  <View style={styles.navigationContainer}>
                    <TouchableOpacity
                      onPress={handlePrevImage}
                      style={styles.navButton}
                    >
                      <Icon
                        name="chevron-left-outline"
                        style={styles.navIcon}
                      />
                    </TouchableOpacity>

                    <View style={styles.imageCounter}>
                      <Text style={styles.counterText}>
                        {currentImageIndex + 1} / {todasLasImagenes.length}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleNextImage}
                      style={styles.navButton}
                    >
                      <Icon
                        name="chevron-right-outline"
                        style={styles.navIcon}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Thumbnail Grid */}
                <FlatList
                  data={todasLasImagenes}
                  horizontal
                  scrollEnabled
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => handleThumbnailPress(index)}
                      style={[
                        styles.thumbnail,
                        currentImageIndex === index && styles.thumbnailActive
                      ]}
                    >
                      <Image
                        source={{ uri: item }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                  keyExtractor={(_, index) => index.toString()}
                  style={styles.thumbnailList}
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {tipo !== 'CONSULTA_TUTOR' && onResponder && (
                <Button
                  style={styles.actionButton}
                  appearance="outline"
                  onPress={onResponder}
                  size="medium"
                  accessoryLeft={(props) => (
                    <Icon {...props} name="corner-up-left-outline" />
                  )}
                >
                  Responder
                </Button>
              )}
              <Button
                style={styles.actionButton}
                onPress={onClose}
                size="medium"
              >
                Cerrar
              </Button>
            </View>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  card: {
    flex: 1,
    maxHeight: '90%',
    borderRadius: 16,
    margin: 0,
    marginTop: 20
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  headerContent: {
    flex: 1,
    paddingRight: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8
  },
  author: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 4
  },
  date: {
    fontSize: 11,
    color: '#A0AEC0'
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F7FAFC'
  },
  closeIcon: {
    width: 20,
    height: 20
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#E2E8F0'
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  badgeIcon: {
    width: 14,
    height: 14,
    marginRight: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  alcanceBadge: {
    backgroundColor: '#FEE6F8',
    borderWidth: 1,
    borderColor: '#F093FB',
  },
  alcanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F093FB',
  },
  contentSection: {
    marginBottom: 20
  },
  content: {
    lineHeight: 24,
    color: '#2D3748',
    fontSize: 15
  },
  imagesSection: {
    marginBottom: 20
  },
  imagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12
  },
  mainImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mainImage: {
    width: '100%',
    height: '100%'
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center'
  },
  navIcon: {
    width: 20,
    height: 20
  },
  imageCounter: {
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568'
  },
  thumbnailList: {
    marginBottom: 12
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  thumbnailActive: {
    borderColor: '#F093FB',
    borderWidth: 3
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20
  },
  actionButton: {
    flex: 1,
    borderRadius: 12
  }
});
