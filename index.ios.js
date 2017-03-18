import React, { Component } from "react";
import {
  AppRegistry,
  CameraRoll,
  Dimensions,
  Image,
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
    opacity: 0.5
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
  }
  refreshPhotos() {
    CameraRoll.getPhotos({
      first: 50,
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
        console.log(JSON.stringify(this.state.photos));
      },
      e => logError(e)
    );
  }
  render() {
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
          style={styles.preview}
          aspect={Camera.constants.Aspect.fill}
        >
          <Image
            style={{
              position: "absolute",
              width,
              height,
              left: 0,
              top: 0,
              opacity: this.state.opacity
            }}
            source={this.state.selectedImage}
            {...this._panResponder.panHandlers}
          />

          <TouchableHighlight
            onPress={() => this.setState({ modalVisible: true })}
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
                marginBottom: 10,
                borderWidth: 5,
                borderColor: "#fff"
              }}
            />
          </TouchableOpacity>
        </Camera>
      </View>
    );
  }
  takePicture() {
    this.camera
      .capture()
      .then(data => this.refreshPhotos())
      .catch(err => console.error(err));
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
