//
//  PicStitcher.swift
//  ghostcam
//
//  Created by Christian Genco on 2017-03-28.
//  Copyright © 2017 Facebook. All rights reserved.
//

import Foundation

@objc(PicStitcher)
class PicStitcher: NSObject {
  
  @objc(addEvent:location:)
  func addEvent(name: String, location: String) -> Void {
    // Date is ready to use!
  }
  
//  @objc(stitch:)
//  func stitch(params: NSDictionary) -> Void {
//    print("stitch called!")
//    print(params.photos);
//  }

  @objc(stitch:pic2:)
  func stitch(pic1: String, pic2: String) -> Void {
    print(pic1);
    print(pic2)
  }
}
