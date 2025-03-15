import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { 
  StyleSheet, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  View, 
  Platform, 
  KeyboardAvoidingView, 
  TouchableWithoutFeedback, 
  Keyboard 
} from "react-native";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { api } from "@/utils/api";
import * as ImagePicker from 'expo-image-picker';
import { ScrollView } from "react-native-gesture-handler";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

type ItemDetails = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  coordinates?: string;
  createdAt?: string;
  user: string;
};

export default function EditItemScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  
  // Loading and permission states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  
  // Function to normalize image URLs (replace backslashes with forward slashes)
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    return url.replace(/\\/g, '/');
  };

  // Fetch existing item data
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
          const item = response.data as ItemDetails;
          console.log('Fetched item details:', item);
          
          // Check if user has permission to edit this item
          if (item.user && user && item.user !== user.id) {
            router.back();
            showMessage({
              message: "You don't have permission to edit this item",
              type: "danger",
              duration: 3000
            });
            return;
          }
          
          // Populate form with existing data
          setName(item.name || '');
          setDescription(item.description || '');
          setCoordinates(item.coordinates || '');
          
          if (item.image) {
            setImage(normalizeImageUrl(item.image));
            setOriginalImage(normalizeImageUrl(item.image));
          }
          
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
  }, [id, user]);

  // Take new picture
  const pickImage = async () => {
    if (!isMobile) {
      showMessage({ 
        message: 'Camera functionality is only available on mobile devices', 
        type: 'info' 
      });
      return;
    }

    if (status !== 'granted') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        setStatus(status);
      } else {
        showMessage({ 
          message: 'Camera permission is required to take pictures', 
          type: 'danger'
        });
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        setImageChanged(true);
        showMessage({ message: 'Picture updated!', type: 'success' });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      showMessage({ message: 'Failed to take picture', type: 'danger' });
    }
  };

  // Choose image from gallery instead
  const chooseFromGallery = async () => {
    if (!isMobile) {
      showMessage({ 
        message: 'Gallery access is only available on mobile devices', 
        type: 'info' 
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        setImageChanged(true);
        showMessage({ message: 'Image selected!', type: 'success' });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showMessage({ message: 'Failed to select image', type: 'danger' });
    }
  };

  // Handle update item
  const handleUpdateItem = async () => {
    if (!name || !description) {
      showMessage({ 
        message: 'Please fill out all mandatory fields (name & description)', 
        type: 'danger' 
      });
      return;
    }

    setIsSaving(true);
    try {
      // Here, I decided to keep the original image even if the user removes the original.
      let imageUrl = originalImage;
      
      // Upload new image if changed
      if (image && imageChanged) {
        const imageResponse = await api.uploadImage(image);
        if (imageResponse.error) {
          throw new Error(imageResponse.error);
        }
        imageUrl = imageResponse.data?.imageUrl;
      }
      
      // Update item 
      const itemData = {
        name,
        description,
        coordinates: coordinates || '',
        image: imageUrl || '',
      };
      
      console.log('Updating item with data:', itemData);
      const response = await api.updateItem(id.toString(), itemData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      showMessage({ message: 'Item updated successfully!', type: 'success' });
      
      // Return to item detail page
      setTimeout(() => {
        // Remove the past item details from router history
        router.replace(`/items/${id}`);
      }, 1000);
    } catch (error: any) {
      console.error('Error updating item:', error);
      showMessage({ 
        message: `Failed to update item: ${error.message}`, 
        type: 'danger' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Item' }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0582CA" />
          <ThemedText style={styles.loadingText}>Loading item details...</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Item' }} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 50}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedView style={styles.container}>
              <ThemedText type="title" style={styles.title}>
                <Ionicons name="pencil" size={24} color="#0582CA" /> Edit Item
              </ThemedText>
              <ThemedView style={styles.form_container}>
                <TextInput 
                  placeholder="Item name*" 
                  style={styles.form_input} 
                  placeholderTextColor={"#0582CA"}
                  value={name}
                  onChangeText={setName}
                />
                <TextInput 
                  placeholder="Item description*" 
                  style={[styles.form_input, { height: 100, textAlignVertical: 'top' }]} 
                  placeholderTextColor={"#0582CA"}
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                />
                <ThemedView style={styles.flex_column}>
                  <TextInput 
                    placeholder="Coordinates" 
                    style={styles.form_input} 
                    placeholderTextColor={"#0582CA"}
                    value={coordinates}
                    onChangeText={setCoordinates}
                  />
                  <Text style={styles.optional_text}>Optional</Text>
                </ThemedView>
                
                {/* Display selected image if available */}
                {image && (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: image }} 
                      style={styles.imagePreview} 
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => {
                        setImage(null);
                        setImageChanged(true);
                      }}
                    >
                      <ThemedText style={{ color: '#fff' }}>Remove</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Image selection buttons */}
                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.imageButton, !isMobile && styles.disabledButton]}
                    onPress={pickImage}
                  >
                    <Ionicons name="camera" size={16} color="#fff" style={styles.buttonIcon} />
                    <ThemedText style={{ color: '#fff' }}>
                      Take Photo
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.imageButton, !isMobile && styles.disabledButton]}
                    onPress={chooseFromGallery}
                  >
                    <Ionicons name="images" size={16} color="#fff" style={styles.buttonIcon} />
                    <ThemedText style={{ color: '#fff' }}>
                      Gallery
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                
                {/* Action buttons */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCancel}
                  >
                    <ThemedText style={{ color: '#0582CA' }}>Cancel</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.submit_button, isSaving && styles.disabledButton]} 
                    onPress={handleUpdateItem}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <ThemedText style={{ color: '#fff' }}>Save Changes</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </ThemedView>
            <FlashMessage position="bottom" />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  form_container: {
    padding: 20,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  flex_column: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  form_input: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#0582CA",
    borderRadius: 5,
    width: '100%',
    color: "#0582CA",
  },
  title: {
    textAlign: 'center',
    paddingBottom: 20,
    lineHeight: 40,
  },
  optional_text: {
    color: "#687076",
    fontSize: 12,
    textAlign: 'right',
  },
  submit_button: {
    backgroundColor: "#0582CA",
    padding: 15,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderColor: "#0582CA",
    borderWidth: 1,
    padding: 15,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  disabledButton: {
    backgroundColor: "#85C1E9",
  },
  imagePreviewContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 5,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  imageButton: {
    backgroundColor: "#0582CA",
    padding: 12,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  buttonIcon: {
    marginRight: 5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 10,
  }
});