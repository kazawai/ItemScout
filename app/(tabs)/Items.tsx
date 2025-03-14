import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Link, Stack, router } from "expo-router";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { Dimensions, StyleSheet, Image, TouchableOpacity, ActivityIndicator, TextInput, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { api } from "@/utils/api";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { Ionicons } from "@expo/vector-icons";

type Item = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  createdAt?: string;
};

export default function ItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const PAGE_SIZE = 10;
  const flatListRef = useRef(null);

  const deviceWidth = Dimensions.get('window').width;
  const itemWidth = deviceWidth > 600 ? (deviceWidth - 60) / 2 : deviceWidth - 40;
  const numColumns = deviceWidth > 600 ? 2 : 1;

  // TODO : Centralize this function in a utils file
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    return url.replace(/\\/g, '/');
  };

  // Fetch initial items
  const fetchItems = useCallback(async (page = 1, refresh = false) => {
    try {
      setError(null);
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Fetch items from API
      const response = await api.getItems(page, PAGE_SIZE);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        const newItems = response.data.items || [];
        // Check if we've reached the end of the list
        if (newItems.length < PAGE_SIZE) {
          setHasMoreItems(false);
        }

        // Update the items list
        if (refresh) {
          setItems(newItems);
        } else {
          setItems(prevItems => [...prevItems, ...newItems]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch items');
      showMessage({
        message: 'Failed to load items',
        description: error instanceof Error ? error.message : 'Please try again',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchItems(1, true);
  }, [fetchItems]);

  // Handle load more when reaching end of list
  const loadMoreItems = () => {
    if (isLoadingMore || !hasMoreItems) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchItems(nextPage);
  };

  // Refresh the list
  const handleRefresh = async () => {
    if (isLoading) return;
    setCurrentPage(1);
    setHasMoreItems(true);
    await fetchItems(1, true);
  };

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      handleRefresh();
      return;
    }

    setIsSearching(true);
    try {
      setError(null);
      setIsLoading(true);
      
      // Here you would need to implement a search endpoint in your API
      // For now, we'll just filter the results client-side (not ideal for large datasets)
      const response = await api.getItems(1, 50); // Get more items to search through
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data?.items) {
        const filteredItems = response.data.items.filter(
          item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setItems(filteredItems);
        setHasMoreItems(false); // Disable infinite scroll during search
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    handleRefresh();
  };

  // TODO : Centralize this function in a utils file
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render a single item
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
            <View style={styles.noImageContainer}>
              <Image
                source={require('@/assets/images/logov1.png')}
                style={styles.noImage}
                resizeMode="contain"
              />
            </View>
          )}
          
          <ThemedView style={styles.itemContent}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            <ThemedView style={styles.separator} />
            <ThemedText style={styles.itemDescription} numberOfLines={3}>
              {item.description}
            </ThemedText>
            
            {item.createdAt && (
              <ThemedText style={styles.itemDate}>
                Added: {formatDate(item.createdAt)}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
    </Link>
  );

  // Render list footer (loading indicator)
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0582CA" />
        <ThemedText style={styles.footerText}>Loading more items...</ThemedText>
      </View>
    );
  };

  // Render empty list component
  const renderEmptyList = () => {
    if (isLoading) return null;
    
    return (
      <ThemedView style={styles.emptyContainer}>
        <Image 
          source={require('@/assets/images/logov1.png')} 
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <ThemedText style={styles.emptyText}>
          {searchQuery ? 'No items match your search' : 'No items found'}
        </ThemedText>
        <TouchableOpacity style={styles.button} onPress={handleRefresh}>
          <ThemedText style={styles.buttonText}>Refresh</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'All Items',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )
      }} />
      
      <ThemedView style={styles.container}>
        {/* Search bar */}
        <ThemedView style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.searchButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Ionicons name="search" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </ThemedView>
        
        {/* Error message */}
        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.button} onPress={handleRefresh}>
              <ThemedText style={styles.buttonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
        
        {/* List of items */}
        {isLoading && !isLoadingMore ? (
          <ActivityIndicator size="large" color="#0582CA" style={styles.loader} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            numColumns={numColumns}
            contentContainerStyle={styles.flatListContainer}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyList}
            ListFooterComponent={renderFooter}
            onEndReached={loadMoreItems}
            onEndReachedThreshold={0.3}
            refreshing={isLoading && currentPage === 1}
            onRefresh={handleRefresh}
          />
        )}
        
        {/* Add item button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.navigate('/CreateItemScreen')}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </ThemedView>
      
      <FlashMessage position="bottom" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  flatListContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  item: {
    marginBottom: 20,
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
    height: 180,
    backgroundColor: '#f5f5f5',
  },
  noImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImage: {
    width: 100,
    height: 100,
    opacity: 0.5,
  },
  itemContent: {
    padding: 15,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e050',
    marginVertical: 8,
    width: '100%',
  },
  button: {
    backgroundColor: '#0582CA',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 15,
    textAlign: 'center',
  },
  emptyImage: {
    width: 100,
    height: 100,
    opacity: 0.3,
    marginBottom: 20,
  },
  loader: {
    marginTop: 50,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0582CA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});