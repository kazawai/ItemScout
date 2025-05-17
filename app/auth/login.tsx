import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import FlashMessage, { showMessage } from "react-native-flash-message";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState("");
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      showMessage({
        message: "Please fill in all required fields",
        type: "danger",
      });
      return;
    } else if (!isLoginView && !name) {
      showMessage({
        message: "Please enter your name",
        type: "danger",
      });
      return;
    } else if (!isLoginView && password.length < 6) {
      showMessage({
        message: "Password must be at least 6 characters long",
        type: "danger",
      });
      return;
    }

    try {
      setIsLoading(true);
      let success;
      if (isLoginView) {
        success = await login(email, password);
        if (success) {
          showMessage({
            message: "Login successful",
            type: "success",
          });
        } else {
          showMessage({
            message: "Login failed. Please check your credentials.",
            type: "danger",
          });
        }
      } else {
        if (!name) {
          showMessage({
            message: "Please enter your name",
            type: "danger",
          });
          return;
        }
        success = await register(email, name, password);
        if (success) {
          showMessage({
            message: "Registration successful",
            type: "success",
          });
        } else {
          showMessage({
            message: "Registration failed. Please try again.",
            type: "danger",
          });
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      showMessage({
        message: "An error occurred. Please try again later.",
        type: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isLoginView ? "Login" : "Register",
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedView style={styles.container}>
              <View style={styles.logoContainer}>
                <ThemedView style={{ alignItems: "center", marginBottom: 20 }}>
                  <Image
                    source={require("@/assets/images/logov1.png")}
                    style={{ width: 100, height: 100, resizeMode: "contain" }}
                  />
                </ThemedView>
                <ThemedText type="title">ItemScout</ThemedText>
                <ThemedText>Find your items with ease</ThemedText>
              </View>

              <ThemedView style={styles.formContainer}>
                <ThemedText type="subtitle" style={styles.formTitle}>
                  {isLoginView
                    ? "Login to your account"
                    : "Create a new account"}
                </ThemedText>

                {!isLoginView && (
                  <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor="#0582CA"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#0582CA"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#0582CA"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleAuth}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <ThemedText style={styles.buttonText}>
                      {isLoginView ? "Login" : "Register"}
                    </ThemedText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsLoginView(!isLoginView)}
                  style={styles.switchAuthMode}
                >
                  <ThemedText type="link">
                    {isLoginView
                      ? "Don't have an account? Register"
                      : "Already have an account? Login"}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <FlashMessage position="bottom" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  formContainer: {
    width: "100%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  formTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#0582CA",
    borderRadius: 5,
    color: "#0582CA",
  },
  button: {
    width: "100%",
    backgroundColor: "#0582CA",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  switchAuthMode: {
    marginTop: 20,
  },
});
