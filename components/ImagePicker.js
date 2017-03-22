import React, { Component } from "react";
import {
  AppRegistry,
  AppState,
  CameraRoll,
  Dimensions,
  Image,
  ListView,
  StyleSheet,
  StatusBar,
  Modal,
  TouchableHighlight,
  TouchableOpacity,
  View
} from "react-native";
import Camera from "react-native-camera";

var logError = require("logError");
let { width, height } = Dimensions.get("window");

export default class ImagePicker extends Component {
  state = {
    photos: [],
    dataSource: new ListView.DataSource({ rowHasChanged: (a, b) => a !== b })
    // selectedImage: null,
    // modalVisible: false,
  };

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
    return (
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
    );
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
