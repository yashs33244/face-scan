import React from 'react';
import Avatar from './Avatar';

export const PhotoConfirmationModal = ({ 
  photoConfirmation = {}, 
  handlePhotoConfirmation, 
  avatarGuides 
}) => {
  if (!photoConfirmation.show || !photoConfirmation.currentView || !photoConfirmation.tempPhoto) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col" 
        style={{
          width: "90%",
          maxWidth: "500px",
        }}
      >
        <h2 className="text-lg font-bold p-4 text-center text-gray-800">
          Confirm {photoConfirmation.currentView.replace(/([A-Z])/g, ' $1').trim()} Photo
        </h2>
        <div className="flex-1 flex flex-col px-4 space-y-4 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            <p className="text-center text-gray-600 mb-2">
              {avatarGuides[photoConfirmation.currentView]?.description || ""}
            </p>
            <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center min-h-0">
              <Avatar currentView={photoConfirmation.currentView} />
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <p className="text-center text-gray-600 mb-2">Your Captured Photo</p>
            <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center min-h-0">
              <img 
                src={photoConfirmation.tempPhoto} 
                alt="Captured" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center space-x-4 p-4">
          <button
            onClick={() => handlePhotoConfirmation(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
          >
            Confirm Photo
          </button>
          <button
            onClick={() => handlePhotoConfirmation(false)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Retake
          </button>
        </div>
      </div>
    </div>
  );
};