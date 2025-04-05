import React, { useState, useEffect } from 'react';

const AvatarSelect = ({ avatars, selectedAvatar, setSelectedAvatar }) => {
  const initialIndex = Math.min(Math.floor(avatars.length / 2), avatars.length - 1);
  const [centerIndex, setCenterIndex] = useState(initialIndex);

  useEffect(() => {
    if (avatars[centerIndex]) {
      setSelectedAvatar(avatars[centerIndex]);
    }
  }, [centerIndex]);

  const handlePrev = () => {
    if (centerIndex > 0) {
      setCenterIndex(centerIndex - 1);
    }
  };

  const handleNext = () => {
    if (centerIndex < avatars.length - 1) {
      setCenterIndex(centerIndex + 1);
    }
  };

  const handleAvatarClick = (index) => {
    setCenterIndex(index);
  };

  const leftAvatar = avatars[centerIndex - 1];
  const centerAvatar = avatars[centerIndex];
  const rightAvatar = avatars[centerIndex + 1];

  return (
    <div className="mb-4 text-center">
      <h2 className="text-lg font-extrabold">Choose an Avatar</h2>
      <div className="flex items-center justify-center m-10 relative">
        <button 
          onClick={handlePrev} 
          className="absolute left-10 w-16 h-16 rounded-full bg-amber-700 hover:bg-amber-800 disabled:opacity-50 md:w-12 md:h-12 md:left-0"
          disabled={centerIndex <= 0}
        >
          &#8592;
        </button>

        <div className="flex space-x-4">
          {leftAvatar && (
            <div
              className="cursor-pointer transition-transform duration-300"
              style={{ transform: 'scale(0.8)', opacity: 0.4 }}
              onClick={() => handleAvatarClick(centerIndex - 1)}
            >
              <img
                src={leftAvatar.payload}
                alt="Left Avatar"
                className="w-16 h-16 rounded-full"
              />
            </div>
          )}

          <div
            className="cursor-pointer transition-transform duration-300"
            style={{ transform: 'scale(1.5)', opacity: 1 }}
            onClick={() => handleAvatarClick(centerIndex)}
          >
            <img
              src={centerAvatar.payload}
              alt="Center Avatar"
              className={`w-20 h-20 rounded-full border-4 ${
                selectedAvatar?.payload === centerAvatar.payload 
                  ? 'border-green-500' 
                  : 'border-transparent'
              }`}
            />
          </div>

          {rightAvatar && (
            <div
              className="cursor-pointer transition-transform duration-300"
              style={{ transform: 'scale(0.8)', opacity: 0.4 }}
              onClick={() => handleAvatarClick(centerIndex + 1)}
            >
              <img
                src={rightAvatar.payload}
                alt="Right Avatar"
                className="w-16 h-16 rounded-full"
              />
            </div>
          )}
        </div>

        <button 
          onClick={handleNext} 
          className="absolute right-10 w-16 h-16 rounded-full bg-amber-700 hover:bg-amber-800 disabled:opacity-50 md:w-12 md:h-12 md:right-0"
          disabled={centerIndex >= avatars.length - 1}
        >
          &#8594;
        </button>
      </div>
    </div>
  );
};

export default AvatarSelect;
