import { useEffect } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";

export default function LogoutScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      await logout();
      // After logout, redirect to login screen
      router.replace("/auth/login");
    };

    handleLogout();
  }, [logout, router]);

  // Show loading indicator while logout is processing
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Logout" }} />
      <ActivityIndicator size="large" color="#0582CA" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
