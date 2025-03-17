import { useCallback } from 'react';

const useCheckFacePosition = () => {
  const calculateIntersectionArea = useCallback((face, canvas) => {
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width / 6;
    const radiusY = height / 3;

    // Get face box coordinates
    const faceLeft = face.box.x;
    const faceRight = face.box.x + face.box.width;
    const faceTop = face.box.y;
    const faceBottom = face.box.y + face.box.height;

    let insidePoints = 0;
    let totalPoints = 0;
    const samplingDensity = 10; // Points to check per pixel

    // Sample points within the face box
    for (let x = faceLeft; x <= faceRight; x += 1 / samplingDensity) {
      for (let y = faceTop; y <= faceBottom; y += 1 / samplingDensity) {
        totalPoints++;

        // Check if point is inside ellipse using the ellipse equation
        const dx = (x - centerX) / radiusX;
        const dy = (y - centerY) / radiusY;
        if (dx * dx + dy * dy <= 1) {
          insidePoints++;
        }
      }
    }

    return insidePoints / totalPoints; // Returns percentage of face box inside ellipse
  }, []);

  const calculateAreaRatio = useCallback((face, canvas) => {
    const { width, height } = canvas;
    const radiusX = width / 6;
    const radiusY = height / 3;

    const ellipseArea = Math.PI * radiusX * radiusY;
    const faceArea = face.box.width * face.box.height;

    return faceArea / ellipseArea;
  }, []);

  const checkFacePosition = useCallback((face, canvas) => {
    const intersectionPercentage = calculateIntersectionArea(face, canvas);
    const areaRatio = calculateAreaRatio(face, canvas);

    // Case 1: More than 50% of face is outside the oval
    if (intersectionPercentage < 0.5) {
      return {
        isValid: false,
        message: 'Please position your face within the oval guide',
      };
    }

    // Case 2: Face is too small (ratio less than 1:2)
    if (areaRatio < 0.5) {
      return {
        isValid: false,
        message: 'Please move closer to the camera',
      };
    }

    return {
      isValid: true,
      message: '',
    };
  }, [calculateIntersectionArea, calculateAreaRatio]);

  return checkFacePosition;
};

export default useCheckFacePosition;