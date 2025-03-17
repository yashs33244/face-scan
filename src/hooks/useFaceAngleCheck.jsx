import { useRef } from 'react';
import * as faceapi from 'face-api.js';

const useFaceAngleCheck = () => {
  const previousYawRef = useRef(null);
  const smoothingFactor = 0.3;

  const checkFaceAngle = async (video, currentView) => {
    try {
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (!detection) {
        return { isValid: false, message: 'No face detected', angle: null };
      }

      const landmarks = detection.landmarks;
      const jawOutline = landmarks.getJawOutline();
      const nose = landmarks.getNose();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      const jawLeft = jawOutline[0];
      const jawRight = jawOutline[jawOutline.length - 1];
      const jawWidth = Math.abs(jawRight.x - jawLeft.x);

      const leftEyeCenter = {
        x: leftEye.reduce((sum, pt) => sum + pt.x, 0) / leftEye.length,
        y: leftEye.reduce((sum, pt) => sum + pt.y, 0) / leftEye.length
      };
      const rightEyeCenter = {
        x: rightEye.reduce((sum, pt) => sum + pt.x, 0) / rightEye.length,
        y: rightEye.reduce((sum, pt) => sum + pt.y, 0) / rightEye.length
      };
      const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);

      const noseTop = nose[0];
      const noseTip = nose[nose.length - 1];
      const noseOffset = (noseTip.x - noseTop.x) / jawWidth;

      const eyeRatio = eyeDistance / jawWidth;
      const noseDeviation = noseOffset * 2;

      const rawYaw = (
        (1 - eyeRatio) * 90 * Math.sign(noseDeviation) +
        noseDeviation * 45
      );

      const smoothedYaw = previousYawRef.current === null
        ? rawYaw
        : previousYawRef.current + smoothingFactor * (rawYaw - previousYawRef.current);

      previousYawRef.current = smoothedYaw;

      const currentAngle = Math.round(smoothedYaw);
      let message = '';
      let isValid = false;

      // Check angle ranges for each view
      switch (currentView) {
        case 'center':
        case 'centerTop':
          isValid = currentAngle >= 57 && currentAngle <= 59;
          message = isValid ? '' : 'Adjust to front view (55-57 degrees)';
          break;

        case 'halfLeft':
        case 'halfLeftTop':
          isValid = currentAngle >= 61 && currentAngle <= 64;
          message = isValid ? '' : 'Adjust to half-left view (61-64 degrees)';
          break;

        case 'fullLeft':
        case 'fullLeftTop':
          isValid = currentAngle >= 65;
          message = isValid ? '' : 'Turn more to the left (65+ degrees)';
          break;

        case 'halfRight':
        case 'halfRightTop':
          isValid = currentAngle >= 58 && currentAngle <= 59;
          message = isValid ? '' : 'Adjust to half-right view (58-59 degrees)';
          break;

        case 'fullRight':
        case 'fullRightTop':
          isValid = currentAngle >= 61 && currentAngle <= 63;
          message = isValid ? '' : 'Adjust to full-right view (61-63 degrees)';
          break;

        default:
          isValid = false;
          message = 'Unknown view position';
      }

      return { isValid, message, angle: currentAngle };
    } catch (error) {
      console.error('Error checking face angle:', error);
      return { isValid: false, message: 'Error checking face angle', angle: null };
    }
  };

  return { checkFaceAngle };
};

export default useFaceAngleCheck;