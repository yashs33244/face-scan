import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import S3 from './S3';

const UploadModal = ({ showUploadModal, setShowUploadModal, capturedPhotos }) => {
  const [instanceCode, setInstanceCode] = useState(''); // For pre-existing unique ID
  const [newInstanceCode, setNewInstanceCode] = useState(''); // For creating a new unique ID
  const [studentRollNo, setStudentRollNo] = useState('');
  const [useExistingCode, setUseExistingCode] = useState(true); // Toggle between existing and new code

  // Function to generate a unique code
  const generateUniqueCode = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-character alphanumeric code
    // Check if the code already exists (you can call an API or check S3)
    const isUnique = await checkCodeUniqueness(code);
    if (isUnique) {
      return code;
    } else {
      return generateUniqueCode(); // Recursively generate a new code if not unique
    }
  };

  // Function to check if the code is unique (mock implementation)
  const checkCodeUniqueness = async (code) => {
    // Replace this with an actual API call or S3 check
    // For now, assume all codes are unique
    return true;
  };

  // Auto-generate a unique code when "Create New Code" is selected
  useEffect(() => {
    if (!useExistingCode) {
      generateUniqueCode().then((code) => setNewInstanceCode(code));
    }
  }, [useExistingCode]);

  const handleInstanceCodeChange = (e) => {
    const value = e.target.value;
    // Ensure the input is a 6-character alphanumeric code
    if (/^[A-Za-z0-9]{0,6}$/.test(value)) {
      setInstanceCode(value);
    }
  };

  return (
    <>
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md mx-auto relative sm:p-6">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <h2 className="text-lg sm:text-xl font-bold mb-4 text-center pr-8">
              Upload Photos
            </h2>

            {/* Toggle between existing and new instance code */}
            <div className="flex items-center mb-4">
              <button
                onClick={() => setUseExistingCode(true)}
                className={`flex-1 py-2 px-4 rounded-l ${
                  useExistingCode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Use Existing Code
              </button>
              <button
                onClick={() => setUseExistingCode(false)}
                className={`flex-1 py-2 px-4 rounded-r ${
                  !useExistingCode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Create New Code
              </button>
            </div>

            {/* Input for pre-existing instance code */}
            {useExistingCode && (
              <input
                type="text"
                placeholder="Enter 6-character Instance Code"
                value={instanceCode}
                onChange={handleInstanceCodeChange}
                className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
            )}

            {/* Input for creating a new instance code */}
            {!useExistingCode && (
              <input
                type="text"
                placeholder="Generating Unique Code..."
                value={newInstanceCode}
                readOnly // Prevent user from editing the auto-generated code
                className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
              />
            )}

            {/* Input for student roll number */}
            <input
              type="text"
              placeholder="Enter Student Roll Number"
              value={studentRollNo}
              onChange={(e) => setStudentRollNo(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {(instanceCode || newInstanceCode) && studentRollNo && (
              <div className="w-full overflow-x-auto">
                <S3
                  capturedPhotos={capturedPhotos}
                  studentRollNo={studentRollNo}
                  instanceCode={useExistingCode ? instanceCode : newInstanceCode} // Pass the selected instance code
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UploadModal;