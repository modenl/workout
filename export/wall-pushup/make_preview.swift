import Foundation
import AVFoundation
import AppKit
import ImageIO
import UniformTypeIdentifiers
let root = CommandLine.arguments[1]
let asset = AVURLAsset(url: URL(fileURLWithPath: root + "/wall_pushup.mp4"))
let duration = CMTimeGetSeconds(asset.duration)
print("Duration: \(duration) seconds")
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.maximumSize = CGSize(width: 640, height: 480)
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: root + "/wall_pushup.gif") as CFURL, UTType.gif.identifier as CFString, 48, nil)!
CGImageDestinationSetProperties(dest, [kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFLoopCount: 0]] as CFDictionary)
for i in 0..<48 {
 let img = try gen.copyCGImage(at: CMTime(value: Int64(i * 2), timescale: 24), actualTime: nil)
 CGImageDestinationAddImage(dest, img, [kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFDelayTime: 1.0 / 12.0]] as CFDictionary)
}
print("GIF complete: \(CGImageDestinationFinalize(dest))")
