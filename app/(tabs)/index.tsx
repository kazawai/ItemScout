import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Welcome to ItemScout👋</ThemedText>
        <ThemedText style={styles.link}>WIP</ThemedText>
      </ThemedView>
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
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  title: {
    textAlign: 'center',
  },
});