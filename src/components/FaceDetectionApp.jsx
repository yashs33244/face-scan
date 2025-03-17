import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import Avatar from './Avatar';
import { PhotoConfirmationModal } from './PhotoConfirmationModel.jsx';
import beepSound from '/assets/beep.mp3';
import UploadModal from './UploadModal.jsx';
import InstructionModal from './InstructionModal.jsx';

const FaceDetection = () => {
  const angleRequirements = {
    center: { 
      yaw: { min: -10, max: 10 },
      pitch: { min: 15, max: 30 },
      message: 'Face straight ahead, looking directly at the camera'
    },
    centerTop: { 
      yaw: { min: -10, max: 10 },
      pitch: { min: 25, max: 40 },
      message: 'Face forward and tilt head up slightly'
    },
    halfLeft: { 
      yaw: { min: 20, max: 25 }, // Adjusted yaw range
      pitch: { min: 20, max: 40 },
      message: 'Turn your head approximately 20° to the left'
    },
    halfLeftTop: { 
      yaw: { min: 20, max: 25 }, // Adjusted yaw range
      pitch: { min: 35, max: 80 },
      message: 'Turn 20° left and tilt head up'
    },
    fullLeft: { 
      yaw: { min: 20, max: 25 }, // Adjusted yaw range
      pitch: { min: 25, max: 45 },
      message: 'Turn your head fully to the left (approximately 20°)'
    },
    halfRight: { 
      yaw: { min: -25, max: -20 }, // Adjusted yaw range
      pitch: { min: 20, max: 35 },
      message: 'Turn your head approximately 20° to the right'
    },
    halfRightTop: { 
      yaw: { min: -25, max: -20 }, // Adjusted yaw range
      pitch: { min: 35, max: 80 },
      message: 'Turn 20° right and tilt head up'
    },
    fullRight: { 
      yaw: { min: -25, max: -20 }, // Adjusted yaw range
      pitch: { min: 0, max: 65 },
      message: 'Turn your head fully to the right (approximately 20°)'
    },
  };

  const videoRef = useRef();
  const canvasRef = useRef();
  
  const [capturedPhotos, setCapturedPhotos] = useState({
    center: null,
    centerTop: null,
    halfLeft: null,
    halfLeftTop: null,
    fullLeft: null,
    halfRight: null,
    halfRightTop: null,
    fullRight: null,
  });
  const [currentView, setCurrentView] = useState('center');
  const [warning, setWarning] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [photoConfirmation, setPhotoConfirmation] = useState({
    show: false,
    tempPhoto: null,
    currentView: null
  });
  const [allPhotosComplete, setAllPhotosComplete] = useState(false);
  const [luminanceWarning, setLuminanceWarning] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [angleVisible, setAngleVisible] = useState(true);
  const isCapturing = useRef(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
 
  const hasBeeped = useRef(false);
  const angleCheckTimeout = useRef(null);

  const previousYawRef = useRef(null);
  const previousPitchRef = useRef(null);

  const smoothingFactor = 0.3;
  const currentViewRef = useRef(currentView);

  const [audio] = useState(new Audio(beepSound));
  const playBeep = () => {
    audio.currentTime = 0; // Reset audio to start
    audio.play().catch(error => console.log('Audio play failed:', error));
  };

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  const avatarGuides = {
    center: {
      image: "/images/center.png",
      description: "Face straight ahead, looking directly at the camera"
    },
    centerTop: {
      image: "/images/center_top.png",
      description: "Face straight ahead, tilt your head slightly upward"
    },
    halfLeft: {
      image: "/images/half_right.png",
      description: "Turn your head approximately 20° to the left"
    },
    halfLeftTop: {
      image: "/images/half_right_top.png",
      description: "Turn your head 20° left, tilt slightly upward"
    },
    fullLeft: {
      image: "/images/full_right.png",
      description: "Turn your head fully to the left (approximately 20°)"
    },
    halfRight: {
      image: "/images/half_left.png",
      description: "Turn your head approximately 20° to the right"
    },
    halfRightTop: {
      image: "/images/half_left_top.png",
      description: "Turn 20° right, tilt slightly upward"
    },
    fullRight: {
      image: "/images/full_left.png",
      description: "Turn your head fully to the right (approximately 20°)"
    },
  };

  const loadModels = async () => {
    const MODEL_URL = '/models';
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      startVideo();
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading models:', err);
      setWarning('Error loading face detection models');
    }
  };

  useEffect(() => {
    loadModels();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error('Error accessing webcam:', err);
        setWarning('Unable to access webcam');
      });
  };

  const checkLuminance = (videoElement) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    context.drawImage(videoElement, 0, 0);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let totalLuminance = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      totalLuminance += luminance;
    }
    
    const avgLuminance = totalLuminance / (data.length / 4);
    
    const TOO_DARK = 40;
    const TOO_BRIGHT = 240;
    
    if (avgLuminance < TOO_DARK) {
      return {
        isValid: false,
        message: 'Scene is too dark. Please increase lighting.'
      };
    } else if (avgLuminance > TOO_BRIGHT) {
      return {
        isValid: false,
        message: 'Scene is too bright. Please reduce lighting.'
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  };

  const drawOvalGuide = (ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width / 6;
    const radiusY = height / 2.7;

    ctx.strokeStyle = '#56e39f';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const calculateIntersectionArea = (face, canvas) => {
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width / 6;
    const radiusY = height / 3;
    
    const faceLeft = face.box.x;
    const faceRight = face.box.x + face.box.width;
    const faceTop = face.box.y;
    const faceBottom = face.box.y + face.box.height;
    
    let insidePoints = 0;
    let totalPoints = 0;
    const samplingDensity = 10;
    
    for (let x = faceLeft; x <= faceRight; x += 1/samplingDensity) {
      for (let y = faceTop; y <= faceBottom; y += 1/samplingDensity) {
        totalPoints++;
        
        const dx = (x - centerX) / radiusX;
        const dy = (y - centerY) / radiusY;
        if (dx * dx + dy * dy <= 1) {
          insidePoints++;
        }
      }
    }
    
    return insidePoints / totalPoints;
  };

  const calculateAreaRatio = (face, canvas) => {
    const { width, height } = canvas;
    const radiusX = width / 6;
    const radiusY = height / 3;
    
    const ellipseArea = Math.PI * radiusX * radiusY;
    const faceArea = face.box.width * face.box.height;
    
    return faceArea / ellipseArea;
  };

  const checkFacePosition = (face, canvas) => {
    const intersectionPercentage = calculateIntersectionArea(face, canvas);
    const areaRatio = calculateAreaRatio(face, canvas);
    
    if (intersectionPercentage < 0.4) {
      return {
        isValid: false,
        message: 'Please position your face within the oval guide'
      };
    }
    
    if (areaRatio < 0.4) {
      return {
        isValid: false,
        message: 'Please move closer to the camera'
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  };

  const checkFaceAngle = async (video) => {
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
  
      if (!detection) {
        return { isValid: false, message: 'No face detected', yaw: null, pitch: null };
      }
  
      const landmarks = detection.landmarks;
      const jaw = landmarks.getJawOutline();
      const nose = landmarks.getNose();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
  
      const leftEyeCenter = {
        x: leftEye.reduce((sum, pt) => sum + pt.x, 0) / leftEye.length,
        y: leftEye.reduce((sum, pt) => sum + pt.y, 0) / leftEye.length
      };
      const rightEyeCenter = {
        x: rightEye.reduce((sum, pt) => sum + pt.x, 0) / rightEye.length,
        y: rightEye.reduce((sum, pt) => sum + pt.y, 0) / rightEye.length
      };
  
      const eyeLineAngle = Math.atan2(
        rightEyeCenter.y - leftEyeCenter.y,
        rightEyeCenter.x - leftEyeCenter.x
      );
  
      const eyeDistance = Math.hypot(
        rightEyeCenter.x - leftEyeCenter.x,
        rightEyeCenter.y - leftEyeCenter.y
      );
  
      const noseTip = nose[3];
      
      const midEyeX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
      const yawDeviation = (noseTip.x - midEyeX) / eyeDistance;
      const rawYaw = yawDeviation * 45;
  
      const rotatedNoseY = Math.cos(eyeLineAngle) * (noseTip.y - leftEyeCenter.y) -
                          Math.sin(eyeLineAngle) * (noseTip.x - leftEyeCenter.x);
      const rawPitch = (rotatedNoseY / eyeDistance) * 45;
  
      const smoothedYaw = previousYawRef.current === null 
        ? rawYaw 
        : previousYawRef.current + smoothingFactor * (rawYaw - previousYawRef.current);
      
      const smoothedPitch = previousPitchRef.current === null 
        ? rawPitch 
        : previousPitchRef.current + smoothingFactor * (rawPitch - previousPitchRef.current);
  
      previousYawRef.current = smoothedYaw;
      previousPitchRef.current = smoothedPitch;
  
      const currentYaw = Math.round(smoothedYaw);
      const currentPitch = Math.round(smoothedPitch);
  
      const currentReq = angleRequirements[currentViewRef.current];
      if (!currentReq) {
        return { isValid: false, message: 'Unknown view position', yaw: currentYaw, pitch: currentPitch };
      }
  
      const isValidYaw = currentYaw >= currentReq.yaw.min && currentYaw <= currentReq.yaw.max;
      const isValidPitch = currentPitch >= currentReq.pitch.min && currentPitch <= currentReq.pitch.max;
      const isValid = isValidYaw && isValidPitch;
  
      let message = '';
      if (!isValid) {
        if (!isValidYaw && !isValidPitch) {
          message = `Adjust yaw to ${currentReq.yaw.min}°-${currentReq.yaw.max}° and pitch to ${currentReq.pitch.min}°-${currentReq.pitch.max}°`;
        } else if (!isValidYaw) {
          message = `Adjust yaw to ${currentReq.yaw.min}°-${currentReq.yaw.max}°`;
        } else if (!isValidPitch) {
          message = `Adjust pitch to ${currentReq.pitch.min}°-${currentReq.pitch.max}°`;
        }
      } else {
        message = currentReq.message;
      }
  
      return { isValid, message, yaw: currentYaw, pitch: currentPitch };
    } catch (error) {
      console.error('Error checking face angle:', error);
      return { isValid: false, message: 'Error checking face angle', yaw: null, pitch: null };
    }
  };

  const handleVideoPlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const displaySize = { 
      width: video.videoWidth,
      height: video.videoHeight 
    };

    faceapi.matchDimensions(canvas, displaySize);

    const intervalId = setInterval(async () => {
      if (!video || !canvas || cooldownTime > 0) return;

      const luminanceCheck = checkLuminance(video);
      if (!luminanceCheck.isValid) {
        setWarning(luminanceCheck.message);
        setLuminanceWarning(luminanceCheck.message);
        return;
      } else {
        setLuminanceWarning('');
      }

      const detections = await faceapi.detectAllFaces(
        video, 
        new faceapi.TinyFaceDetectorOptions()
      );

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext('2d');
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawOvalGuide(ctx, canvas.width, canvas.height);

      if (detections.length === 0) {
        setWarning('No face detected. Ensure proper positioning and lighting');
      } else if (detections.length > 1) {
        setWarning('Multiple faces detected');
      } else {
        const faceCheck = checkFacePosition(detections[0], canvas);
        if (!faceCheck.isValid) {
          setWarning(faceCheck.message);
          return;
        }

        const angleCheck = await checkFaceAngle(video);
        
        if (!angleCheck.isValid) {
          setWarning(angleCheck.message);
        } else {
          setWarning('');
        }

        if (angleVisible && angleCheck.yaw !== null && angleCheck.pitch !== null) {
          ctx.font = '20px Arial';
          ctx.fillStyle = angleCheck.isValid ? '#00FF00' : '#FF0000';
          ctx.fillText(`Yaw: ${angleCheck.yaw}° Pitch: ${angleCheck.pitch}°`, 20, 30);
        }

        if (
          angleCheck.isValid &&
          !isCapturing.current &&
          !['center', 'centerTop'].includes(currentViewRef.current) &&
          !capturedPhotos[currentViewRef.current] &&
          !hasBeeped.current
        ) {
          hasBeeped.current = true;
          playBeep();
          isCapturing.current = true;
          
          angleCheckTimeout.current = setTimeout(() => {
            capturePhoto();
            hasBeeped.current = false;
          }, 1000);
        }
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      if (angleCheckTimeout.current) {
        clearTimeout(angleCheckTimeout.current);
      }
    };
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    hasBeeped.current = false;
    isCapturing.current = true;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    const photo = canvas.toDataURL('image/jpeg');

    const isManualConfirmRequired = ['center', 'centerTop'].includes(currentViewRef.current);
    
    if (isManualConfirmRequired) {
      setPhotoConfirmation({
        show: true,
        tempPhoto: photo,
        currentView: currentViewRef.current
      });
    } else {
      handlePhotoConfirmation(true, photo);
    }

    setCooldownTime(3);
    const cooldownInterval = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          clearInterval(cooldownInterval);
          isCapturing.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePhotoConfirmation = (confirmed, photo = null) => {
    if (confirmed) {
      const finalPhoto = photo || photoConfirmation.tempPhoto;
      
      setCapturedPhotos(prev => ({
        ...prev,
        [currentViewRef.current]: finalPhoto,
      }));

      const sequence = {
        center: 'centerTop',
        centerTop: 'halfLeft',
        halfLeft: 'halfLeftTop',
        halfLeftTop: 'fullLeft',
        fullLeft: 'halfRight',
        halfRight: 'halfRightTop',
        halfRightTop: 'fullRight',
        fullRight: null
      };

      const nextView = sequence[currentViewRef.current];
      if (nextView) {
        setCooldownTime(3);
        const cooldownInterval = setInterval(() => {
          setCooldownTime(prev => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              setCurrentView(nextView);
              currentViewRef.current = nextView;
              setWarning(`Adjust for ${nextView.replace(/([A-Z])/g, ' $1').trim()}`);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setAllPhotosComplete(true);
        setShowUploadModal(true);
      }
    }

    setPhotoConfirmation({
      show: false,
      tempPhoto: null,
      currentView: null
    });
  };

  const handleRetake = (view) => {
    setCurrentView(view);
    setCapturedPhotos(prev => ({
      ...prev,
      [view]: null
    }));
    setAllPhotosComplete(false);
    setWarning(`Retaking ${view} photo`);
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4">
      {showInstructions && (
        <InstructionModal setShowInstructions={setShowInstructions} />
      )}

      {luminanceWarning && (
        <div className="w-full mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700 text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            {luminanceWarning}
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/4 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Current Pose Guide
          </h3>
          <div className="flex flex-col items-center">
            <div className="text">{avatarGuides[currentView].description}</div>
            <img src={avatarGuides[currentView].image}></img>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Object.values(capturedPhotos).filter(Boolean).length}/8</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                style={{
                  width: `${(Object.values(capturedPhotos).filter(Boolean).length / 8) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="absolute top-0 left-0 w-full h-full object-cover"
              onPlay={handleVideoPlay}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>

          {warning && (
            <div className="w-full bg-yellow-50 border-l-4 border-yellow-400 p-3 text-yellow-700 text-sm mt-2">
              {warning}
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <button
              onClick={capturePhoto}
              disabled={isLoading || warning !== '' || cooldownTime > 0}
              className={`px-6 py-2 rounded ${
                isLoading || warning !== '' || cooldownTime > 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {cooldownTime > 0 ? 
                `Next capture in ${cooldownTime}s` : 
                `Capture ${currentView}${['center', 'centerTop'].includes(currentView) ? ' (Manual)' : ''}`
              }
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mt-8">
        <h3 className="text-lg font-semibold mb-4">Captured Photos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(capturedPhotos).map(([view, photo]) => (
            <div key={view} className="relative">
              {photo ? (
                <div className="relative group">
                  <img
                    src={photo}
                    alt={`${view} view`}
                    className="w-full h-40 sm:h-48 object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => handleRetake(view)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <div className="w-full h-40 sm:h-48 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-gray-400">{view}</span>
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2 text-center">
                {view.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <PhotoConfirmationModal 
        photoConfirmation={photoConfirmation}
        handlePhotoConfirmation={handlePhotoConfirmation}
        avatarGuides={avatarGuides}
      />

      <UploadModal
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
        capturedPhotos={capturedPhotos}
      />
    </div>
  );
};

export default FaceDetection;