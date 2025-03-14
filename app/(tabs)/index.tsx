import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { Link, router, Stack } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Image, TouchableOpacity, ActivityIndicator, View, RefreshControl, ScrollView } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { api } from "@/utils/api";
import { useThemeColor } from "@/hooks/useThemeColor";

type Item = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  createdAt?: string;
};

type SectionData = {
  type: 'header' | 'item' | 'error' | 'button';
  data?: any;
}


export default function HomeScreen() {
  const { user } = useAuth();
  const flatListRef = useRef(null);

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

      setIsLoading(true);

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
      setRefreshing(false);
    }
  }, [numColumns]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (refreshing) {
      fetchItems().then(() => setRefreshing(false));
    }
  }
  , [refreshing, fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  }

  const generateListData = useCallback(() => {
    const data: any[] = [];
    
    // Welcome section
    data.push({
      id: 'welcome',
      type: 'welcome',
      title: 'Welcome to ItemScout👋',
      user: user
    });

    // Last items published text
    data.push({
      id: 'lastItems',
      type: 'sectionTitle',
      title: 'Here are the last items published.'
    });

    // Error message if any
    if (error) {
      data.push({
        id: 'error',
        type: 'error',
        message: error
      });
    }
    
    // Items grid
    data.push({
      id: 'items',
      type: 'items',
      items: items
    });
    
    // Buttons
    data.push({
      id: 'buttons',
      type: 'buttons'
    });

    return data;
  }, [error, items, user]);

  const renderItemGrid = ({ item }: { item: Item }) => (
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

  const renderEmptyItems = () => {
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

  const renderItem = ({ item }: { item: any }) => {
    switch(item.type) {
      case 'welcome':
        return (
          <View style={styles.welcomeSection}>
            <ThemedText type="title" style={styles.title}>{item.title}</ThemedText>
            {item.user && (
              <ThemedText style={styles.welcomeUser}>Hello, {item.user.name}</ThemedText>
            )}
          </View>
        );
        
      case 'sectionTitle':
        return (
          <ThemedText style={[styles.link, {marginTop: 50}]}>{item.title}</ThemedText>
        );
        
      case 'error':
        return (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{item.message}</ThemedText>
            <TouchableOpacity style={styles.button} onPress={fetchItems}>
              <ThemedText style={styles.buttonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        );
        
      case 'items':
        return (
          <ThemedView style={styles.flex_card}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#0582CA" style={styles.loader} />
            ) : (
              <View style={styles.flatListContainer}>
                {item.items.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {item.items.map((gridItem: Item) => (
                      <View key={gridItem._id} style={{ width: itemWidth }}>
                        {renderItemGrid({ item: gridItem })}
                      </View>
                    ))}
                  </View>
                ) : (
                  renderEmptyItems()
                )}
              </View>
            )}
          </ThemedView>
        );
        
      case 'buttons':
        return (
          <ThemedView style={styles.flex_row}>
            <TouchableOpacity style={styles.button} onPress={() => router.navigate('/Items', { relativeToDirectory: true })}>
              <ThemedText style={styles.buttonText}>See all items</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.navigate('/CreateItemScreen', { relativeToDirectory: true })}>
              <ThemedText style={styles.buttonText}>Add new items</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        );
        
      default:
        return null;
    }
  };

  const backgroundColor = useThemeColor({}, 'background');
  const listData = generateListData();

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0582CA']}
            progressBackgroundColor="#FFFFFF"
            tintColor="#0582CA"
          />
        }
        ListFooterComponent={<View style={{ height: 20 }} />}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor, flex: 1 }}
      />
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
  welcomeSection: {
    width: '100%',
    alignItems: 'center',
  },
  flex_row: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginVertical: 15,
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