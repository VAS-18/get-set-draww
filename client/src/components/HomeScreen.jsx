
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const HomeScreen = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [theme, setTheme] = useState('');
  const avatars = ['/avatars/avatar1.png', '/avatars/avatar2.png', '/avatars/avatar3.png'];
  const themes = ['Animals', 'Space', 'Food'];

  useEffect(() => {
    if (!socket) return;

    socket.on('roomCreated', ({ roomId }) => {
      navigate(`/${roomId}`);
    });

    socket.on('roomJoined', ({ roomId }) => {
      navigate(`/${roomId}`);
    });

    socket.on('error', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('error');
    };
  }, [socket, navigate]);

  const handleCreateRoom = () => {
    if (!nickname || !selectedAvatar || !theme) {
      alert('Please select a nickname, avatar, and theme');
      return;
    }
    socket.emit('createRoom', { nickname, theme });
  };

  const handleJoinRoom = () => {
    if (!nickname || !selectedAvatar || !roomIdInput) {
      alert('Please enter a nickname, avatar, and room code');
      return;
    }
    socket.emit('joinRoom', { roomId: roomIdInput, nickname });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">1v1 Drawing Game</h1>

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter your nickname"
          className="w-full p-2 mb-4 border rounded"
        />

        <div className="mb-4">
          <h2 className="text-lg font-semibold">Choose an Avatar</h2>
          <div className="flex space-x-2 overflow-x-auto">
            {avatars.map((avatar, index) => (
              <img
                key={index}
                src={avatar}
                alt={`Avatar ${index + 1}`}
                className={`w-16 h-16 cursor-pointer rounded-full ${
                  selectedAvatar === avatar ? 'border-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedAvatar(avatar)}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowPopup(true)}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Start
        </button>

        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
                    <option key={t} value={t}>{t}</option>
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

              <button
                onClick={() => setShowPopup(false)}
                className="mt-4 text-red-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;