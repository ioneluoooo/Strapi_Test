import Geolocation from '@react-native-community/geolocation';
import React, { useEffect, useState } from 'react';
import { Button, PermissionsAndroid, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import socket from 'socket.io-client';
import dotenv from "dotenv"

dotenv.config()

const SERVER_URL = process.env.SERVER_URL;

const App = () => {
  const [region, setRegion] = useState({ latitude: 0, longitude: 0 });
  const [isSending, setIsSending] = useState(true);

  const io = socket(SERVER_URL);

  useEffect(() => {
    io.emit('join', (error: Error) => {
      console.log('joined a stream');
      if (error) console.log(error);
    });
  }, []);

  const requestLocation = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need to access your location',
          buttonNegative: 'Cancel',
          buttonPositive: 'Ok',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission granted');
        getCurrentLocation();
      } else {
        console.log('Location permission denied');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getCurrentLocation = () => {
    const locationUpdate = setInterval(() => {
      Geolocation.getCurrentPosition(
        position => {
          console.log(position);
          setRegion({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          if (isSending) {
            io.emit('setLocation', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        },
        error => {
          console.error(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    }, 5000);

    return () => clearInterval(locationUpdate);
  };

  const stopSendingLocation = () => {
    setIsSending(false);
    // Emit a signal to the server to stop sending location updates
    io.emit('stopSendingLocation');
  };

  const getSomeoneLocation = () => {
    io.on('getLocation', data => {
      console.log(data);
      setRegion({
        latitude: data.latitude,
        longitude: data.longitude,
      });
    });

    return () => {
      io.off('getLocation');
    };
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        region={{
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}>
        <Marker coordinate={region} />
      </MapView>
      <Button title="Set Location" onPress={requestLocation} />
      <Button title="Stop sending location" onPress={stopSendingLocation} />
      <Button title="Get Location" onPress={getSomeoneLocation} />
    </View>
  );
};

export default App;
