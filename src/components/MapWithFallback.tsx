import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

// Define types
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// Safe map wrapper component
const MapWithFallback = ({
  initialRegion,
  onRegionChange,
  onLocationSelect,
  style,
}: {
  initialRegion: Region;
  onRegionChange?: (region: Region) => void;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  style?: any;
}) => {
  // State for the component
  const [mapReady, setMapReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Load react-native-maps only when component mounts
  const [MapView, setMapView] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);

  // Try to load the map component
  useEffect(() => {
    const loadMapComponents = async () => {
      try {
        // Dynamic import with error handling
        const ReactNativeMaps = await import('react-native-maps');
        setMapView(() => ReactNativeMaps.default);
        setMarker(() => ReactNativeMaps.Marker);
        setMapReady(true);
      } catch (error) {
        console.error('Failed to load map components:', error);
        setHasError(true);
      }
    };

    loadMapComponents();
  }, []);

  // Function to get current location
  const getCurrentLocation = () => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization('whenInUse');
    }

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        
        // If callback provided, send the location data
        if (onLocationSelect) {
          onLocationSelect(latitude, longitude);
        }
        
        // Update region if callback provided
        if (onRegionChange) {
          onRegionChange({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      },
      error => {
        console.error('Error getting current location:', error);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your location settings and try again.',
          [{ text: 'OK' }]
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // If there was an error loading the map, show fallback UI
  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>Map could not be loaded</Text>
        <Text style={styles.errorSubtext}>
          Please enter coordinates manually or try restarting the app
        </Text>
        <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
          <Text style={styles.locationButtonText}>Use My Current Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If map is not loaded yet, show loading state
  if (!mapReady || !MapView) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Map is loaded and ready, render the map
  return (
    <View style={[{ flex: 1 }, style]}>
      <MapView
        style={{ flex: 1 }}
        region={initialRegion}
        onRegionChangeComplete={onRegionChange}
        onPress={(event: any) => {
          if (onLocationSelect) {
            const { coordinate } = event.nativeEvent;
            onLocationSelect(coordinate.latitude, coordinate.longitude);
          }
        }}
        provider="google"
        liteMode={true} // Use lite mode to reduce memory usage
      >
        {Marker && (
          <Marker
            coordinate={{
              latitude: initialRegion.latitude,
              longitude: initialRegion.longitude,
            }}
            draggable
            onDragEnd={(e: any) => {
              if (onLocationSelect) {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                onLocationSelect(latitude, longitude);
              }
            }}
          />
        )}
      </MapView>
      <TouchableOpacity 
        style={styles.myLocationButton}
        onPress={getCurrentLocation}
      >
        <Text style={styles.myLocationButtonText}>📍 My Location</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  locationButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  locationButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  myLocationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapWithFallback; 