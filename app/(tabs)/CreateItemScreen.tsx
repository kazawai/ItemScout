import CameraView from "@/components/CameraView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Stack } from "expo-router";
import { useState, useRef } from "react";
import { StyleSheet, TextInput, Text, TouchableOpacity } from "react-native";
import FlashMessage, { showMessage } from "react-native-flash-message";

export default function CreateItemScreen() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coordinates, setCoordinates] = useState('');
    // const cameraRef = useRef(null);

    // const handleTakePicture = async () => {
    //     if (cameraRef.current) {
    //         // @ts-ignore
    //         const photo = await cameraRef.current.takePicture();
    //         console.log(photo);
    //         showMessage({ message: 'Picture taken!', type: 'success' });
    //     }
    // };

    const handleCreateItem = () => {
        if (!name || !description) {
            showMessage({ message: 'Please fill out all mandatory fields (name & description)', type: 'danger' });
            return;
        }

        showMessage({ message: 'Item created!', type: 'success' });
    }

    return (
    <>
        <Stack.Screen options={{ title: 'Input' }} />
        <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Input new items 🚀</ThemedText>
        <ThemedView style={styles.form_container}>
            <TextInput placeholder="Item name*" style={styles.form_input} placeholderTextColor={"#0582CA"} />
            <TextInput placeholder="Item description*" style={styles.form_input} placeholderTextColor={"#0582CA"} />
            <ThemedView style={styles.flex_column}>
                <TextInput placeholder="Coordinates" style={styles.form_input} placeholderTextColor={"#0582CA"} />
                <Text style={styles.optional_text}>Optional</Text>
            </ThemedView>
            <TouchableOpacity style={styles.submit_button}>
                <ThemedText>Take picture of item</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submit_button} onPress={() => handleCreateItem()}>
                <ThemedText>Create item</ThemedText>
            </TouchableOpacity>
        </ThemedView>
        </ThemedView>
        <FlashMessage position="bottom" />
        {/* <CameraView ref={cameraRef}/> */}
    </>
    );
}

const styles = StyleSheet.create({
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
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
});