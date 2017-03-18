import React, { Component } from "react";
import {
  AppRegistry,
  CameraRoll,
  Dimensions,
  Image,
  ListView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View
} from "react-native";
import Camera from "react-native-camera";

var logError = require("logError");
const { width, height } = Dimensions.get("window");

export default class ghostcam extends Component {
  state = {
    photos: [],
    dataSource: new ListView.DataSource({ rowHasChanged: (a, b) => a !== b }),
    width: 0,
    height: 0
  };
  componentDidMount() {
    CameraRoll.getPhotos({
      first: 10,
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
    if (true) {
      return (
        <ListView
          contentContainerStyle={styles.list}
          dataSource={this.state.dataSource}
          renderRow={rowData => (
            <Image style={styles.imageThumb} source={rowData.image} />
          )}
        />
      );
    }

    return (
      <View style={styles.container}>
        <Camera
          ref={cam => this.camera = cam}
          style={styles.preview}
          aspect={Camera.constants.Aspect.fill}
        >

          <Text style={styles.capture} onPress={this.takePicture.bind(this)}>
            [CAPTURE]
          </Text>
        </Camera>
      </View>
    );
  }
  takePicture() {
    this.camera
      .capture()
      .then(data => console.log(data))
      .catch(err => console.error(err));
  }
}

const photoGutter = 3;
const imageWidth = width / 3 - photoGutter;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row"
  },
  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  capture: {
    flex: 0,
    backgroundColor: "#fff",
    borderRadius: 5,
    color: "#000",
    padding: 10,
    margin: 40
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
