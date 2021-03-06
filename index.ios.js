import React, { Component } from "react";
import {
  AppRegistry,
  AppState,
  Animated,
  AlertIOS,
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
  View,
  NativeModules
} from "react-native";
import Camera from "react-native-camera";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import Orientation from "react-native-orientation";

var logError = require("logError");
let { width, height } = Dimensions.get("window");

// const { InAppUtils, PicStitcher } = NativeModules;

export default class ghostcam extends Component {
  state = {
    photos: [],
    dataSource: new ListView.DataSource({ rowHasChanged: (a, b) => a !== b }),
    selectedImage: null,
    modalVisible: false,
    opacity: 0.5,
    flashOpacity: new Animated.Value(0),
    stitch: false,
    flip: false,
    flashMode: Camera.constants.FlashMode.auto,
    orientation: "PORTRAIT"
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

    // InAppUtils.loadProducts(
    //   ["co.gen.pastcam.frontfacingcamera"],
    //   (error, products) => {
    //     if (products.length > 0)
    //       AlertIOS.alert("loadProducts", JSON.stringify(products));
    //   }
    // );

    // AlertIOS.alert(Orientation.getInitialOrientation(), "lol");
    const orientationMap = {
      "LANDSCAPE-LEFT": Camera.constants.Orientation.landscapeLeft,
      "LANDSCAPE-RIGHT": Camera.constants.Orientation.landscapeRight,
      PORTRAIT: Camera.constants.Orientation.portrait,
      PORTRAITUPSIDEDOWN: Camera.constants.Orientation.portrait,
      UNKONWN: Camera.constants.Orientation.portrait
    };
    Orientation.addSpecificOrientationListener(orientationString => {
      const orientation =
        orientationMap[orientationString] ||
        Camera.constants.Orientation.portrait;
      this.setState({ orientation });
      // AlertIOS.alert(orientation, "lol");
    });
  }
  refreshPhotos(after = null) {
    console.log(`after=${after}`);
    const getPhotosParams = {
      first: 3 * 10,
      groupTypes: "SavedPhotos",
      assetType: "Photos"
    };
    if (after) getPhotosParams.after = after;
    CameraRoll.getPhotos(getPhotosParams).then(
      photosRes => {
        // console.log(JSON.stringify(photosRes));
        let photos = photosRes.edges.map(r => r.node);
        if (after) photos = [...this.state.photos, ...photos];
        this.setState({
          photos,
          dataSource: this.state.dataSource.cloneWithRows(photos),
          photosPageInfo: photosRes.page_info
        });

        // AlertIOS.alert("photo[0]", JSON.stringify(photos[0].image.uri));
        // PicStitcher.stitch(photos[0].image.uri, photos[1].image.uri);
        // console.log(JSON.stringify(this.state.photos));
      },
      e => logError(e)
    );
  }
  render() {
    let cameraWidth = width,
      cameraHeight = height,
      cameraXOffset = 0;
    if (this.state.selectedImage) {
      // h1/w1 = h2/w2
      // h1 = h2*w1/w2
      cameraHeight =
        this.state.selectedImage.height *
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
            initialListSize={3 * 7}
            pageSize={3 * 12}
            // scrollRenderAheadDistance={500}
            onEndReached={() => {
              this.refreshPhotos(
                this.state.photosPageInfo
                  ? this.state.photosPageInfo.end_cursor
                  : ""
              );
            }}
            // onEndReachedThreshold={500}
            contentContainerStyle={styles.list}
            dataSource={this.state.dataSource}
            enableEmptySections={false}
            renderRow={rowData =>
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
                      borderColor:
                        this.state.selectedImage === rowData.image
                          ? "rgb(99, 145, 257)"
                          : "rgba(0, 0, 0, 0)",
                      borderWidth: 5,
                      flex: 1
                    }}
                  />
                </Image>
              </TouchableHighlight>}
          />
        </Modal>

        <StatusBar hidden={true} />
        <Camera
          ref={cam => (this.camera = cam)}
          style={[
            styles.preview,
            {
              height: cameraHeight,
              width: cameraWidth,
              marginTop: cameraXOffset
            }
          ]}
          aspect={Camera.constants.Aspect.fill}
          captureTarget={
            Camera.constants.CaptureTarget.disk /*disk or cameraRoll*/
          }
          keepAwake={true}
          type={this.state.flip ? "back" : "front"}
          mirrorImage={this.state.flip}
          flashMode={this.state.flashMode}
          orientation={this.state.orientation}
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

        <TouchableOpacity
          onPress={this.takePicture.bind(this)}
          style={{
            bottom: 10,
            right: width / 2 - 75 / 2,
            height: 75,
            width: 75,
            position: "absolute"
          }}
        >
          <View
            style={{
              borderRadius: 75,
              height: 75,
              width: 75,
              borderWidth: 5,
              borderColor: "#fff"
            }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => this.setState({ flip: !this.state.flip })}
          style={{
            top: 10,
            right: 10,
            height: 30,
            width: 30,
            position: "absolute",
            backgroundColor: "transparent"
          }}
        >
          <Ionicons name="ios-reverse-camera" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const modes = [
              Camera.constants.FlashMode.auto,
              Camera.constants.FlashMode.on,
              Camera.constants.FlashMode.off
            ];
            let i = modes.indexOf(this.state.flashMode);
            i++;
            if (i >= modes.length) i = 0;
            this.setState({
              flashMode: modes[i]
            });
          }}
          style={{
            top: 10,
            left: 10,
            height: 30,
            width: 30,
            position: "absolute",
            backgroundColor: "transparent"
          }}
        >
          <MaterialIcons
            name={
              this.state.flashMode === Camera.constants.FlashMode.auto
                ? "flash-auto"
                : this.state.flashMode === Camera.constants.FlashMode.on
                  ? "flash-on"
                  : "flash-off"
            }
            size={30}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => this.setState({ stitch: !this.state.stitch })}
          style={{
            top: 10,
            right: width / 2 - 30 / 2,
            height: 30,
            width: 30,
            position: "absolute",
            backgroundColor: "transparent"
          }}
        >
          <MaterialIcons
            name="flip"
            size={30}
            color={this.state.stitch ? "#fff" : "#aaa"}
          />
        </TouchableOpacity>
      </View>
    );
  }
  takePicture() {
    this.camera
      .capture()
      .then(rawImageData => {
        // get height and width
        return new Promise((resolve, reject) => {
          Image.getSize(rawImageData.path, (width, height) =>
            resolve({ path: rawImageData.path, width, height })
          );
        });
      })
      .then(rawImageData => {
        let cameraWidth = rawImageData.width,
          cameraHeight = rawImageData.height,
          cameraOffset = 0;
        // h1/w1 = h2/w2 => h1 = h2*w1/w2
        cameraHeight =
          rawImageData.width *
          this.state.selectedImage.height /
          this.state.selectedImage.width;
        cameraOffset = (rawImageData.height - cameraHeight) / 2;

        ImageEditor.cropImage(
          rawImageData.path,
          {
            offset: { x: 0, y: cameraOffset },
            size: { width: cameraWidth, height: cameraHeight }
            // resizeMode
            // displaySize
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
