import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, Alert, Modal, View } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { api } from '@/utils/api';
import FlashMessage, { showMessage } from "react-native-flash-message";
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '@/context/AuthContext';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

type ItemDetails = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  coordinates?: string;
  createdAt?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [location, setLocation] = useState({ latitude: 0, longitude: 0, city: '' });

  const [imageLoading, setImageLoading] = useState(true);
  const IMAGE_TIMEOUT = 15000;

  const isItemOwner = user && item && item.user && user.id === item.user._id;

  // Function to normalize image URLs (replace backslashes with forward slashes)
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    return api.getImageUrl(url);
  };

  // Parse coordinates from string format (e.g. "12.345,67.890")
  const getCoordinates = (coordinateString?: string) => {
    if (!coordinateString) return null;
    
    const parts = coordinateString.split(',').map(part => parseFloat(part.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      return null;
    }
    
    return {
      latitude: parts[0],
      longitude: parts[1],
    };
  };

  function findCity(location: { latitude: number; longitude: number }) {
    //Then fetch the name of the city
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=fi`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setLocation({
          ...location,
          city: data.city
        });
      })
      .catch((error) => console.error('Error fetching city:', error));
  }

  // Format date nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditItem = () => {
    setMenuVisible(false);
    // Navigate to edit screen with the item ID
    router.replace({ pathname: `/editItem/${id}` });
  };

  // Handle delete item with confirmation
  const handleDeleteItem = () => {
    setMenuVisible(false);
    setDeleteAlertVisible(true);
  };

  // Confirm and process item deletion
  const confirmDeleteItem = async () => {
    if (!id) return;
    
    try {
      setDeleteAlertVisible(false);
      setIsDeleting(true);
      
      const response = await api.deleteItem(id.toString());
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      showMessage({
        message: "Item deleted successfully",
        type: "success",
        duration: 3000
      });
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.replace('/Items');
      }, 1000);
      
    } catch (error) {
      console.error('Failed to delete item:', error);
      showMessage({
        message: "Failed to delete item",
        description: error instanceof Error ? error.message : 'An error occurred',
        type: "danger"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  

  // Fetch item details
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!id) {
        setError('No item ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.getItemById(id.toString());
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        if (response.data) {
          // Fetch user details if available
          if (response.data.user) {
            const userResponse = await api.getUserById(response.data.user);
            if (userResponse.data) {
              response.data.user = userResponse.data;
            }
          }
          setItem(response.data);
          const coordinates = getCoordinates(response.data.coordinates);
          if (coordinates) {
            setLocation({
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              city: ''
            });
            findCity({ latitude: coordinates.latitude, longitude: coordinates.longitude });
          }
          console.log('Fetched item details:', response.data);
        } else {
          throw new Error('Item not found');
        }
      } catch (error) {
        console.error('Failed to fetch item details:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch item details');
        showMessage({
          message: 'Failed to load item details',
          type: 'danger',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemDetails();
  }, [id]);

  // Handle image loading timeout
  useEffect(() => {
    if (item?.image) {
      // Handle image loading timeout
      setImageLoading(true);
      const timeoutId = setTimeout(() => {
        if (imageLoading) {
          console.log('Image load timed out');
          setImageError(true);
          setImageLoading(false);
        }
      }, IMAGE_TIMEOUT);
      
      return () => clearTimeout(timeoutId);
    }
  }, [item?.image, imageLoading]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Item Details' }} />
        <ThemedView
          style={styles.loadingContainer}
        >
          <div data-testid="loading-indicator"/>
          <ActivityIndicator size="large" color="#0582CA" />
          <ThemedText style={styles.loadingText}>Loading item details...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error || 'Item not found'}</ThemedText>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }
  
  const OptionsMenu = () => (
    <Modal
      visible={menuVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setMenuVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setMenuVisible(false)}
      >
        <View style={styles.menuPositioner}>
          <ThemedView style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleEditItem}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={20} color="#0582CA" />
              <ThemedText style={styles.menuItemText}>Edit Item</ThemedText>
            </TouchableOpacity>
            
            <ThemedView style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleDeleteItem}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={20} color="#d32f2f" />
              <ThemedText style={[styles.menuItemText, { color: '#d32f2f' }]}>
                Delete Item
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const DeleteAlert = () => (
    <Modal
    visible={deleteAlertVisible}
    transparent={true}
    animationType="fade"
    onRequestClose={() => setDeleteAlertVisible(false)}
  >
    <TouchableOpacity 
      style={styles.alertOverlay} 
      activeOpacity={1}
      onPress={() => setDeleteAlertVisible(false)}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={(e) => e.stopPropagation()}
      >
        <ThemedView style={styles.alertContainer}>
          <Ionicons name="trash" size={48} color="#d32f2f" style={styles.alertIcon} />
          <ThemedText type="title" style={styles.alertTitle}>Delete Item</ThemedText>
          <ThemedText style={styles.alertMessage}>
            Are you sure you want to delete this item? This action cannot be undone.
          </ThemedText>
          <ThemedView style={styles.alertButtonsContainer}>
            <TouchableOpacity 
              style={styles.alertButton} 
              onPress={() => setDeleteAlertVisible(false)}
            >
              <ThemedText style={styles.alertButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.alertButton, styles.alertDeleteButton]} 
              onPress={confirmDeleteItem}
            >
              <ThemedText style={styles.alertDeleteButtonText}>Delete</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
  );

  const windowWidth = Dimensions.get('window').width;

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: item.name,
          headerRight: isItemOwner ? () => (
            <TouchableWithoutFeedback
              onPress={() => setMenuVisible(true)}
              style={styles.optionsButton}
              data-testid="options-menu-button"
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#0582CA" />
            </TouchableWithoutFeedback>
          ) : undefined
        }}
      />

      <OptionsMenu />
      <DeleteAlert />

      {isDeleting && (
        <ThemedView style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <ThemedText style={styles.deletingText}>Deleting item...</ThemedText>
        </ThemedView>
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {item.image && !imageError ? (
          <>
            {imageLoading && (
              <View style={[styles.image, styles.imageLoader]}>
                <ActivityIndicator size="large" color="#0582CA" />
              </View>
            )}
            <Image
              source={{ uri: normalizeImageUrl(item.image) }}
              style={[styles.image, imageLoading ? { opacity: 0 } : { opacity: 1 }]}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
                console.log(imageError);
              }}
            />
          </>
        ) : (
          <Image
            source={require('@/assets/images/logov1.png')}
            style={styles.image}
            resizeMode="contain"
          />
        )}
        
        <ThemedView style={styles.detailsContainer}>
          <ThemedText type="title" style={styles.name}>{item.name}</ThemedText>
          
          <ThemedView style={styles.separator} />
          
          <ThemedText type="subtitle" style={styles.sectionTitle}>Description</ThemedText>
          <ThemedText style={styles.description}>{item.description}</ThemedText>
          
          {item.user && (
            <>
              <ThemedView style={styles.separator} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Added by</ThemedText>
              <ThemedText>{item.user.name}</ThemedText>
            </>
          )}
          
          {item.createdAt && (
            <>
              <ThemedView style={styles.separator} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Date Added</ThemedText>
              <ThemedText>{formatDate(item.createdAt)}</ThemedText>
            </>
          )}

          {location.city && (
            <>
              <ThemedView style={styles.separator} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Location</ThemedText>
              <ThemedText>{location.city} ({location.latitude}, {location.longitude})</ThemedText>
            </>
          )}
          
          {/* {coordinates && (
            <>
              <ThemedView style={styles.separator} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>Location</ThemedText>
              <ThemedView style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                    provider={PROVIDER_GOOGLE}
                >
                  <Marker
                    coordinate={{
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                    }}
                    title={item.name}
                  />
                </MapView>
                <ThemedText style={styles.coordinates}>
                  {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </ThemedText>
              </ThemedView>
            </>
          )} */}
          
          <ThemedView style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.buttonText}>Back to Items</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
        <FlashMessage position="bottom" />
      </ScrollView>
    </>
  );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%',
  },
  contentContainer: {
    paddingBottom: 30,
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#051923',
  },
  detailsContainer: {
    padding: 20,
    minHeight: '100%',
  },
  name: {
    fontSize: 24,
    marginBottom: 5,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#0582CA',
  },
  description: {
    marginBottom: 15,
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e050',
    marginVertical: 15,
  },
  mapContainer: {
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  map: {
    width: windowWidth - 40,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#0582CA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    marginLeft: 10,
  },
  optionsButton: {
    padding: 8,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuPositioner: {
    position: 'absolute',
    top: 35,
    right: 0,
    padding: 10,
  },
  menuContainer: {
    width: 160,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e050',
    width: '100%',
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  deletingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: windowWidth * 0.85,
    maxWidth: 400,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertIcon: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaeaea',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  alertDeleteButton: {
    backgroundColor: '#d32f2f',
  },
  alertDeleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  imageLoader: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#051923',
  },
});