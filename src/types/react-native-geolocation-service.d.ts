declare module 'react-native-geolocation-service' {
  export interface GeolocationResponse {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  export interface GeolocationError {
    code: number;
    message: string;
  }

  export type AuthorizationResult = 'granted' | 'denied' | 'disabled' | 'restricted' | 'not-determined';

  export function requestAuthorization(type: 'always' | 'whenInUse'): Promise<AuthorizationResult>;
  
  export function getCurrentPosition(
    successCallback: (position: GeolocationResponse) => void,
    errorCallback?: (error: GeolocationError) => void,
    options?: {
      timeout?: number;
      maximumAge?: number;
      enableHighAccuracy?: boolean;
      distanceFilter?: number;
      forceRequestLocation?: boolean;
      forceLocationManager?: boolean;
      showLocationDialog?: boolean;
    }
  ): void;

  export function watchPosition(
    successCallback: (position: GeolocationResponse) => void,
    errorCallback?: (error: GeolocationError) => void,
    options?: {
      timeout?: number;
      maximumAge?: number;
      enableHighAccuracy?: boolean;
      distanceFilter?: number;
      forceRequestLocation?: boolean;
      forceLocationManager?: boolean;
      showLocationDialog?: boolean;
    }
  ): number;

  export function clearWatch(watchId: number): void;
  
  export function stopObserving(): void;
  
  export default {
    requestAuthorization,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    stopObserving,
  };
} 