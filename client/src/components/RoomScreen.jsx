// frontend/src/components/RoomScreen.js
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const RoomScreen = () => {
  const { roomId } = useParams();
  const socket = useSocket();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold">Room: {roomId}</h1>
        <p>Waiting for players...</p>
        {/* Add "Ready" button and player list logic later */}
      </div>
    </div>
  );
};

export default RoomScreen;