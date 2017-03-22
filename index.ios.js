import React, { Component } from "react";
import {
  AppRegistry,
  AppState,
  Animated,
  CameraRoll,
  Dimensions,
  Image,
  ImageEditor,
  ListView,
  StyleSheet,
  StatusBar,
  Text,
  Modal,
  TouchableHighlight,
  TouchableOpacity,
  PanResponder,
  View
} from "react-native";
import Camera from "react-native-camera";

var logError = require("logError");
let { width, height } = Dimensions.get("window");

export default class ghostcam extends Component {
  state = {
    photos: [],
    dataSource: new ListView.DataSource({ rowHasChanged: (a, b) => a !== b }),
    selectedImage: null,
    modalVisible: false,
    opacity: 0.5,
    flashOpacity: new Animated.Value(0)
  };
  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (e, gesture) => true,
      onStartShouldSetPanResponderCapture: (e, gesture) => true,
      onMoveShouldSetPanResponder: (e, gesture) => true,
      onMoveShouldSetPanResponderCapture: (e, gesture) => true,
      // onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: (e, gesture) =>
        this.setState({ opacity: gesture.moveX / width })
      // onPanResponderRelease: this._handlePanResponderEnd,
      // onPanResponderTerminate: this._handlePanResponderEnd
    });
  }

  componentDidMount() {
    this.refreshPhotos();
    AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        this.refreshPhotos();
      }
    });
  }
  refreshPhotos() {
    CameraRoll.getPhotos({
      first: 100,
      groupTypes: "SavedPhotos",
      assetType: "Photos"
    }).then(
      photosRes => {
        // console.log(JSON.stringify(photosRes));
        const photos = photosRes.edges.map(r => r.node);
        this.setState({
          photos,
          dataSource: this.state.dataSource.cloneWithRows(photos),
          photosPageInfo: photosRes.page_info
        });
        // console.log(JSON.stringify(this.state.photos));
      },
      e => logError(e)
    );
  }
  render() {
    let cameraWidth = width, cameraHeight = height, cameraXOffset = 0;
    if (this.state.selectedImage) {
      // h1/w1 = h2/w2
      // h1 = h2*w1/w2
      cameraHeight = this.state.selectedImage.height *
        width /
        this.state.selectedImage.width;
      cameraXOffset = (height - cameraHeight) / 2;
    }
    return (
      <View style={styles.container}>
        <Modal
          animationType="slide"
          transparent={false}
          visible={!this.state.selectedImage || this.state.modalVisible}
          onRequestClose={() => this.setState({ modalVisible: false })}
          supportedOrientations={["portrait"]}
        >
          <ListView
            initialListSize={18}
            contentContainerStyle={styles.list}
            dataSource={this.state.dataSource}
            renderRow={rowData => (
              <TouchableHighlight
                onPress={() =>
                  this.setState({
                    selectedImage: rowData.image,
                    modalVisible: false
                  })}
                style={[styles.imageThumb]}
              >
                <Image
                  style={[styles.imageThumb]}
                  source={rowData.image}
                  selected={true}
                >
                  <View
                    style={{
                      borderColor: this.state.selectedImage === rowData.image
                        ? "rgb(99, 145, 257)"
                        : "rgba(0, 0, 0, 0)",
                      borderWidth: 5,
                      flex: 1
                    }}
                  />
                </Image>
              </TouchableHighlight>
            )}
          />
        </Modal>

        <StatusBar hidden={true} />
        <Camera
          ref={cam => this.camera = cam}
          style={[
            styles.preview,
            {
              height: cameraHeight,
              width: cameraWidth,
              marginTop: cameraXOffset
            }
          ]}
          aspect={Camera.constants.Aspect.fill}
          captureTarget={Camera.constants.CaptureTarget.disk}
          keepAwake={true}
        >
          <Image
            style={{
              position: "absolute",
              width: cameraWidth,
              height: cameraHeight,
              left: 0,
              top: 0,
              opacity: this.state.opacity,
              transform: [{ rotate: "0deg" }],
              resizeMode: "contain"
            }}
            source={this.state.selectedImage}
          />

          {/* this might fuck up touch to focus */}
          <Animated.View
            style={{
              backgroundColor: "white",
              position: "absolute",
              width,
              height,
              opacity: this.state.flashOpacity
            }}
            {...this._panResponder.panHandlers}
          />
        </Camera>

        <TouchableHighlight
          onPress={() => {
            this.setState({ modalVisible: true });
            this.refreshPhotos();
          }}
          style={{ position: "absolute", left: 10, bottom: 10 }}
        >
          <Image
            style={{
              width: 50,
              height: 50
            }}
            source={
              this.state.photos[0]
                ? this.state.photos[0].image
                : this.state.selectedImage
            }
          />
        </TouchableHighlight>

        <TouchableOpacity onPress={this.takePicture.bind(this)}>
          <View
            style={{
              borderRadius: 75,
              height: 75,
              width: 75,
              position: "absolute",
              bottom: 10,
              right: width / 2 - 75 / 2 - 10 / 2,
              borderWidth: 5,
              borderColor: "#fff"
            }}
          />
        </TouchableOpacity>
      </View>
    );
  }
  takePicture() {
    this.camera
      .capture()
      .then(rawImageData => {
        ImageEditor.cropImage(
          rawImageData.path,
          {
            offset: { x: 0, y: 0 },
            size: { width: 20, height: 20 }
          },
          uri => {
            CameraRoll.saveToCameraRoll(uri).then(res => {
              // delete rawImageData
              this.refreshPhotos();
            });
          },
          err => logError
        );
      })
      .catch(logError);

    this.state.flashOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(this.state.flashOpacity, {
        toValue: 1,
        duration: 100
      }),
      Animated.timing(this.state.flashOpacity, {
        toValue: 0,
        duration: 100
      })
    ]).start();
  }
}

const photoGutter = 3;
const imageWidth = width / 3 - photoGutter;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#000"
  },
  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  imageThumb: {
    // backgroundColor: "red",
    // margin: 3,
    marginBottom: photoGutter,
    width: imageWidth,
    height: imageWidth
  }
});

AppRegistry.registerComponent("ghostcam", () => ghostcam);
