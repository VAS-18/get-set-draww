import React from "react";

const GameOptions = ({
  theme,
  setTheme,
  roomIdInput,
  setRoomIdInput,
  handleCreateRoom,
  handleJoinRoom,
  onClose,
  themes,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-200 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Game Options</h2>

        <div className="mb-4">
          <h3 className="mb-2">Select Theme</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {themes.map((t, index) => (
              <button
                key={index}
                className={`p-2 rounded ${
                  theme === t.title 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-black'
                } hover:opacity-70`}
                onClick={() => setTheme(t.title)}
              >
                {t.title}
              </button>
            ))}
          </div>
          <button
            onClick={handleCreateRoom}
            disabled={!theme}
            className={`w-full p-2 rounded ${
              theme 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {theme ? 'Create a Room' : 'Select a Theme First'}
          </button>
        </div>

        <div>
          <input
            type="text"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            placeholder="Enter room code"
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={handleJoinRoom}
            className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
          >
            Join a Game
          </button>
        </div>

        <button onClick={onClose} className="mt-4 text-red-500">
          Close
        </button>
      </div>
    </div>
  );
};

export default GameOptions;
