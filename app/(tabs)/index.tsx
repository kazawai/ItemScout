import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { Link, router, Stack } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { api } from "@/utils/api";

type Item = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  createdAt?: string;
};

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const flatListRef = useRef(null);

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deviceWidth = Dimensions.get('window').width;
  const itemWidth = 170;
  const numColumns = Math.floor(deviceWidth / (itemWidth + 20)); // Margin is 20

  // TODO : Centralize this function in a utils file
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    return url.replace(/\\/g, '/');
  };
  // TODO : Centralize this function in a utils file
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      // Fetch items from API
      const response = await api.getItems(1, numColumns);
      
      // Check if the response has data
      if (response.data) {
        const toItems = response.data?.items;
        setItems(toItems);
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        // No items or empty response
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch items');
    } finally {
      setIsLoading(false);
    }
  }, [numColumns]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const renderItem = ({ item }: { item: Item }) => (
    <Link href={`/items/${item._id}`} asChild>
      <TouchableOpacity activeOpacity={0.7} style={{ width: itemWidth }}>
        <ThemedView style={styles.item}>
          {item.image ? (
            <Image
              source={{ uri: normalizeImageUrl(item.image) }}
              style={styles.itemImage}
              resizeMode="cover"
              onError={(e) => {
                console.error('Image load error:', e.nativeEvent.error);
              }}
            />
          ) : (
            <ThemedView style={styles.noImageContainer}>
              <Image
                source={require('@/assets/images/logov1.png')}
                style={styles.noImage}
                resizeMode="contain"
              />
            </ThemedView>
          )}
          
          <ThemedView style={styles.itemContent}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            <ThemedView style={styles.separator} />
            <ThemedText style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </ThemedText>
            
            {item.createdAt && (
              <ThemedText style={styles.itemDate}>
                {formatDate(item.createdAt)}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
    </Link>
  );

  const renderEmptyList = () => {
    if (isLoading) return null;
    
    return (
      <ThemedView style={styles.emptyContainer}>
        <Image 
          source={require('@/assets/images/logov1.png')} 
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <ThemedText style={styles.emptyText}>No items found</ThemedText>
      </ThemedView>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Welcome to ItemScout👋</ThemedText>

        {user && (
          <ThemedText style={styles.welcomeUser}>Hello, {user.name}</ThemedText>
        )}

        <ThemedText style={[styles.link, {marginTop: 50}]}>Here are the last items published.</ThemedText>

        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.button} onPress={fetchItems}>
              <ThemedText style={styles.buttonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        <ThemedView style={styles.flex_card}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#0582CA" style={styles.loader} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={items}
              numColumns={numColumns}
              initialNumToRender={numColumns}
              keyExtractor={item => item._id}
              renderItem={renderItem}
              contentContainerStyle={{ alignItems: 'center' }}
              style={{ width: '100%' }}
              ListEmptyComponent={renderEmptyList}
            />
          )}
          <ThemedView style={styles.flex_row}>
            <TouchableOpacity style={styles.button} onPress={() => router.navigate('/Items', { relativeToDirectory: true })}>
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
    width: '100%',
    gap: 20,
    justifyContent: 'center',
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
  buttonText: {
    color: '#FFFFFF',
  },
  title: {
    textAlign: 'center',
  },
  item: {
    marginBottom: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  itemImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#f5f5f5',
  },
  noImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImage: {
    width: 60,
    height: 60,
    opacity: 0.5,
  },
  itemContent: {
    padding: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'center',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  itemDate: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e050',
    marginVertical: 5,
    width: '100%',
  },
  flatListContainer: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  welcomeUser: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginBottom: 20,
    fontSize: 16,
  },
  emptyImage: {
    width: 80,
    height: 80,
    opacity: 0.3,
    marginBottom: 15,
  },
  errorContainer: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
});