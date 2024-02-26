import './App.css'
import React, { useRef, useState } from 'react'
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@mediapipe/face_mesh";
import Webcam from "react-webcam";
import * as faceLandmarksDetector   from '@tensorflow-models/face-landmarks-detection'
import { TRIANGULATION } from './utils/triangulation';

export const runDetector = async (video, canvas) => {
  const model = faceLandmarksDetector.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = {
    runtime: "tfjs",
  };
  const detector = await faceLandmarksDetector.createDetector(
    model,
    detectorConfig
  );
  const detect = async (net) => {
    const estimationConfig = { flipHorizontal: false };
    const faces = await net.estimateFaces(video, estimationConfig);
    const canvasContext = canvas.getContext('2d')
    requestAnimationFrame(() => drawMesh(faces[0], canvasContext));
    detect(detector); 
  };
  detect(detector); 
};


const drawPath = (ctx, points, closePath) => {
  const region = new Path2D();
  region.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point.x, point.y);
  }
  if (closePath) region.closePath();
  ctx.stokeStyle = "black";
  ctx.stroke(region);
}

export const drawMesh = (prediction, canvasContext) => {

    if(!prediction) return // stop the function if there is no face
    const keyPoints = prediction.keypoints 
    if(!keyPoints) return  
    canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height); //clear the canvas after every drawing
    
    for (let i = 0; i < TRIANGULATION.length / 3; i++) {
      const points = [
        TRIANGULATION[i * 3],
        TRIANGULATION[i * 3 + 1],
        TRIANGULATION[i * 3 + 2],
      ].map((index) => keyPoints[index]);
      drawPath(canvasContext, points, true);
    }

    for (let keyPoint of keyPoints) {
      canvasContext.beginPath();
      canvasContext.arc(keyPoint.x, keyPoint.y, 1, 0, 3 * Math.PI);
      canvasContext.fillStyle = "grey";
      canvasContext.fill();
    }
}

export const App = () => {
  
  const inputResolution = {
    width: 1080,
    height: 900,
  }

  const videoConstraints = {
    width: inputResolution.width,
    height: inputResolution.height,
    facingMode: "user",
  }

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false)

  const handleVideoLoad = (videoNode) => {
    const video = videoNode.target;
    if (video.readyState !== 4) return;
    if (loaded) return;
    runDetector(video, canvasRef.current); //running detection on video
    setLoaded(true);
  };
 

  return (
    <div className="App">
        <Webcam
        style={{  position: "absolute", left: '10%' }}
        videoConstraints={videoConstraints}
        ref={webcamRef}
        width={inputResolution.width}
        height={inputResolution.height}
        onLoadedData={handleVideoLoad}
      />

      <canvas
        ref={canvasRef}
        width={inputResolution.width}
        height={inputResolution.height}
        style={{ position: "absolute", left: '10%' }}
      />
    </div>
  );
}

