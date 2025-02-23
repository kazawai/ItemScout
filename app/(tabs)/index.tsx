import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { router, Stack } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, Image, TouchableOpacity } from "react-native";
import { FlatList } from "react-native-gesture-handler";

export default function HomeScreen() {
  // TODO : API call to get items (only the correct numbers)
  const [items, setItems] = React.useState([
    { id: 1, name: 'Item 1', description: 'Description 1', image: 'https://placehold.co/150x150' },
    { id: 2, name: 'Item 2', description: 'Description 2' },
    { id: 3, name: 'Item 3', description: 'Description 3' },
    { id: 4, name: 'Item 4', description: 'Description 4' },
    { id: 5, name: 'Item 5', description: 'Description 5' },
    { id: 6, name: 'Item 6', description: 'Description 6' },
    { id: 7, name: 'Item 7', description: 'Description 7' },
    { id: 8, name: 'Item 8', description: 'Description 8' },
    { id: 9, name: 'Item 9', description: 'Description 9' },
    { id: 10, name: 'Item 10', description: 'Description 10' },
  ]);

  const deviceWidth = Dimensions.get('window').width;
  const itemWidth = 150;
  const numColumns = Math.floor(deviceWidth / (itemWidth + 20)); // Margin is 20

  const itemsToShow = items.slice(0, numColumns);

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Welcome to ItemScout👋</ThemedText>
        <ThemedText style={[styles.link, {marginTop: 50}]}>Here are the last items published.</ThemedText>
        <ThemedView style={styles.flex_card}>
          <FlatList
            data={itemsToShow}
            numColumns={numColumns}
            initialNumToRender={1}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <ThemedView style={[styles.item, { width: itemWidth }]}>
                {item.image &&
                  <Image
                    source={{ uri: item.image}}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                }
                {!item.image &&
                  <Image
                    source={require('@/assets/images/logov1.svg')}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                }
                <ThemedText>{item.name}</ThemedText>
                <ThemedText>{item.description}</ThemedText>
              </ThemedView>
            )}
            style={{ flexGrow: 0, alignSelf: 'center' }}
          />
          <ThemedView style={styles.flex_row}>
            <TouchableOpacity style={styles.button} onPress={() => router.navigate('/items', { relativeToDirectory: true })}>
              <ThemedText>See all items</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.navigate('/CreateItemScreen', { relativeToDirectory: true })}>
              <ThemedText>Add new items</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
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
  flex_row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    margin: 10,
    // paddingHorizontal: 20,
  },
  flex_card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 10,
    // marginTop: 20,
    gap: 20,
  },
  link: {
    marginTop: 15,
    // paddingVertical: 15,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: 150,
    alignItems: 'center',
    backgroundColor: '#0582CA',
  },
  title: {
    textAlign: 'center',
  },
  item: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',
  },
  itemImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 5,
  },
});