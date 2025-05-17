import { Redirect, Stack } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { ThemedView } from "@/app-example/components/ThemedView";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
    PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#0582CA" />
      </ThemedView>
    );
  }

  return (
    <>
      {/* Set status bar style */}
      <StatusBar
        backgroundColor="#051923"
        barStyle="light-content"
        translucent={false}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </>
  );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const [navigationReady, setNavigationReady] = useState(false);

  // Set navigation ready after initial render
  useEffect(() => {
    const timeout = setTimeout(() => {
      setNavigationReady(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  // Show loading indicator while checking authentication status
  if (isLoading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#0582CA" />
      </ThemedView>
    );
  }

  console.log("User:", user);

  return (
    <>
      {/* Add the Redirect component to handle navigation based on auth state */}
      {!user ? <Redirect href="/auth/login" /> : <Redirect href="/(tabs)" />}

      {/* Register all possible screens */}
      <Stack
        initialRouteName={
          navigationReady ? (user ? "(tabs)" : "auth/login") : "+not-found"
        }
        screenOptions={{
          headerStyle: {
            backgroundColor: "#051923",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontFamily: "PoppinsBold",
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
      </Stack>
    </>
  );
}
