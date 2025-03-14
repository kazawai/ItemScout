import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { api } from '@/utils/api';
import FlashMessage, { showMessage } from "react-native-flash-message";
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

type ItemDetails = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  coordinates?: string;
  createdAt?: string;
  user?: {
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

  // Function to normalize image URLs (replace backslashes with forward slashes)
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    return url.replace(/\\/g, '/');
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

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Item Details' }} />
        <ThemedView style={styles.loadingContainer}>
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

  const coordinates = getCoordinates(item.coordinates);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: item.name,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {item.image && !imageError ? (
          <Image
            source={{ uri: normalizeImageUrl(item.image) }}
            style={styles.image}
            resizeMode="cover"
            onError={(e) => {
              console.error('Image load error:', e.nativeEvent.error);
              setImageError(true);
            }}
          />
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
      </ScrollView>
      <FlashMessage position="bottom" />
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
});