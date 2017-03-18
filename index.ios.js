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

export default class ghostcam extends Component {
  state = {
    photos: []
  };
  componentDidMount() {
    CameraRoll.getPhotos({
      first: 5,
      groupTypes: "SavedPhotos",
      assetType: "Photos"
    }).then(
      photosRes => {
        // console.log(JSON.stringify(photosRes));
        this.setState({
          photos: photosRes.edges.map(r => r.node),
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
        <Camera
          ref={cam => this.camera = cam}
          style={styles.preview}
          aspect={Camera.constants.Aspect.fill}
        >
          {[...this.state.photos].map(photo => {
            return (
              <Image
                key={photo.image.filename}
                style={{ width: 10 }}
                source={photo.image}
              />
            );
          })}
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
  }
});

AppRegistry.registerComponent("ghostcam", () => ghostcam);
