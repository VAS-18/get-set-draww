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
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="">Select a theme</option>
            {themes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateRoom}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Create a Room
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
