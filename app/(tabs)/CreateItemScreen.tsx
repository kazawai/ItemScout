import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Stack, router } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { StyleSheet, TextInput, Text, TouchableOpacity, ActivityIndicator, Image, Modal, View, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from "react-native";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { api } from "@/utils/api";
import * as ImagePicker from 'expo-image-picker';
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';


export default function CreateItemScreen() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coordinates, setCoordinates] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    // Alternative method using ImagePicker if CameraView doesn't work
    const pickImage = async () => {
        if (!isMobile) {
            showMessage({ 
                message: 'Camera functionality is only available on mobile devices', 
                type: 'info' 
            });
            return;
        }

        if (status !== 'granted') {
            (async () => {
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
            })();
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
                showMessage({ message: 'Picture taken!', type: 'success' });
            }
        } catch (error) {
            console.error('Error taking picture:', error);
            showMessage({ message: 'Failed to take picture', type: 'danger' });
        }
    };

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
            showMessage({ message: 'Image selected!', type: 'success' });
          }
        } catch (error) {
          console.error('Error selecting image:', error);
          showMessage({ message: 'Failed to select image', type: 'danger' });
        }
      };

    const handleCreateItem = async () => {
        if (!name || !description) {
            showMessage({ 
                message: 'Please fill out all mandatory fields (name & description)', 
                type: 'danger' 
            });
            return;
        }

        setIsLoading(true);
        try {
            let imageUrl = null;
            
            // Upload image if one was taken
            if (image) {
                const imageResponse = await api.uploadImage(image);
                if (imageResponse.error) {
                    throw new Error(imageResponse.error);
                }
                imageUrl = imageResponse.data?.imageUrl;
            }
            
            // Create item with or without image
            const itemData = {
                name,
                description,
                coordinates: coordinates || undefined,
                image: imageUrl || undefined
            };
            
            const response = await api.createItem(itemData);
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            showMessage({ message: 'Item created successfully!', type: 'success' });
            
            // Clear form
            setName('');
            setDescription('');
            setCoordinates('');
            setImage(null);            
        } catch (error: any) {
            console.error('Error creating item:', error);
            showMessage({ 
                message: `Failed to create item: ${error.message}`, 
                type: 'danger' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <>
        <Stack.Screen options={{ title: 'Input' }} />
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
                        <ThemedText type="title" style={styles.title}>Input new items 🚀</ThemedText>
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
                                        onPress={() => setImage(null)}
                                    >
                                        <ThemedText style={{ color: '#fff' }}>Remove</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            )}
                            
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
                            
                            <TouchableOpacity 
                                style={[styles.submit_button, isLoading && styles.disabledButton]} 
                                onPress={handleCreateItem}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <ThemedText style={{ color: '#fff' }}>Create Item</ThemedText>
                                )}
                            </TouchableOpacity>
                        </ThemedView>
                        <FlashMessage position="bottom" />
                    </ThemedView>
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
    link: {
        marginTop: 15,
        paddingVertical: 15,
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
        width: '100%',
        alignItems: 'center',
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
});