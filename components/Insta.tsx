import React from "react";
import { useEffect, useRef, useState } from "react";
import { FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CapturedPicture } from "expo-camera/build/Camera.types";
import { Camera } from "expo-camera";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Feather } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';


export default function Insta() {

  const [hasPermission, setHasPermission] = useState<boolean|null>(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [pictures, setPictures] = useState<CapturedPicture[]>([]);
  const cameraRef = useRef<Camera|null>();

  const getData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('localPictures')
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch(e) {
      // error reading value
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await getData();
        if (data && data.length > 0) {
          setPictures(data);
        }
      } catch (e) {
        // error reading value
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (pictures.length === 0) {
      AsyncStorage.getItem('localPictures').then((data) => {
        data && setPictures(JSON.parse(data));
      });
    }
    if(pictures.length > 0) {
      AsyncStorage.setItem('localPictures', JSON.stringify(pictures));
    }
  }, [pictures]);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const takePicture = () => {
    cameraRef.current && cameraRef.current.takePictureAsync({ base64: true }).then(picture => {
      console.log(pictures);
      setPictures([picture, ...pictures]);
    });
  };

  const renderPicture: React.FunctionComponent<{item: CapturedPicture}> = ({ item }) => {
    return (
      <View>
      <Image source={{ uri:`data:image/jpg;base64, ${item.base64}` }} style={styles.photo}/>
        <View style={styles.iconsContainer}>
          <Feather 
            name="trash-2" 
            size={24} 
            color="black"
            onPress={() => {
              removePicture(item)
            }}
          />
          <AntDesign 
            name="sharealt" 
            size={24} 
            color="black" 
            onPress={() => {
              openShareDialogAsync();
            }}
          />
          <AntDesign 
            name="cloudo" 
            size={24} 
            color="black" 
            onPress={() => {
              MediaLibrary.requestPermissionsAsync().then(({ status }) => {
                if (status === 'granted') {
                  MediaLibrary.saveToLibraryAsync(item.uri).then(() => {
                    alert('Saved to gallery');
                  });
                } else {
                  alert('No access to gallery');
                }
              });
            }}
          />
        </View>
      </View>
    )
  };

  const removePicture = async (item: CapturedPicture) => {
    try {
      await AsyncStorage.removeItem('localPictures').then(() => {
        setPictures(pictures.filter(picture => picture.base64 !== item.base64));

      });
    } catch(e) {
      // remove error
    }
    console.log('Done.')
  }

  const openShareDialogAsync = async () => {
    if (Platform.OS === 'web') {
      alert(`Uh oh, sharing isn't available on your platform`);
      return;
    }
    await Sharing.shareAsync(pictures[0].uri);
  };


  return (
    <View style={styles.container}>
      <Camera ref={(camera) => {cameraRef.current = camera}} style={styles.camera} type={type}>
        <View style={styles.buttonContainer}>
          <AntDesign 
            name="retweet" 
            size={30} 
            color="white"
            style={styles.flipBtn}
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }} 
          />
          <TouchableOpacity onPress={() => takePicture()} style={styles.takePicture}>
          <Feather 
              name="camera" 
              size={34} 
              color="black"
          />
          </TouchableOpacity>
        </View>
      </Camera>
      <View style={styles.flatlistContainer}>
      <FlatList
        horizontal
        data={pictures}
        renderItem={renderPicture}
        keyExtractor={item => item.uri}  
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    camera: {
        width: 'auto',
        height: '60%',
    },
    buttonContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        margin: 20,
    },
    flipBtn: {
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    takePicture: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        borderWidth: 1,
        position: 'absolute',
        bottom: 15,
        right: 150,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flatlistContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photosList: {
      // flexDirection: 'row-reverse',
    },
    photo: {
        width: 150,
        height: 150,
        marginVertical: 15,
        marginHorizontal: 10,
        alignSelf: 'center',
    },
    iconsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
});