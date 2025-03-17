import { useCallback } from 'react';

const useLuminanceCheck = () => {
  const checkLuminance = useCallback((videoElement) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(videoElement, 0, 0);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalLuminance = 0;

    // Calculate luminance for each pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      totalLuminance += luminance;
    }

    // Calculate average luminance (0-255)
    const avgLuminance = totalLuminance / (data.length / 4);

    // Define luminance thresholds
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
  }, []);

  return { checkLuminance };
};

export default useLuminanceCheck;