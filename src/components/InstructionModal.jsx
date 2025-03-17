import { useState, useEffect } from 'react';
import { Bell, Camera, CheckCircle, XCircle } from 'lucide-react';

const InstructionModal = ({ setShowInstructions }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-xl space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Photo Capture Instructions</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Bell className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                When you hear the <span className="font-semibold">beep sound</span>, 
                please remain still for a moment while the photo is automatically captured.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <Camera className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                For each pose, the system will automatically capture your photo after the beep.
                Please maintain your position until the capture is complete.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                After each capture, please check the preview against the model guide 
                to ensure proper positioning and clarity.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <XCircle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
              <p className="text-gray-700">
                If the photo doesn't match the guide or is unclear, use the retake 
                button to capture again.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => setShowInstructions(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
            >
              I Understand, Let's Begin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionModal;