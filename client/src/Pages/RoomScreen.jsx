import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useState, useEffect } from "react";

const RoomScreen = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [players, setPlayers] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem("userId")); // Gets UserId from the localStorage.

  useEffect(() => {
    if (!socket) return;

    const storedUserId = localStorage.getItem("userId");
    const storedUserJoinedId = localStorage.getItem("userJoineId");
    console.log("Stored userId from localStorage:", storedUserId);
    console.log("Stored userJoinedId from localStorage:", storedUserJoinedId);
    if (storedUserId && roomId) {
      socket.emit("reconnectRoom", { userId: storedUserId, roomId });
    }

    const handlePlayerUpdate = ({ players: updatedPlayers }) => {
      console.log("Received player update:", updatedPlayers);
      setPlayers(updatedPlayers);
    };

    socket.on("playerUpdate", handlePlayerUpdate);

    socket.on("roomRejoined", ({ roomId: rejoinedRoomId, userId, theme }) => {
      console.log(`Rejoined room ${rejoinedRoomId} as ${userId}`);
      localStorage.setItem("roomId", rejoinedRoomId);
      localStorage.setItem("userId", userId);
      setUserId(userId);
    });

    socket.on("error", ({ message }) => {
      console.error("Socket error:", message);
    });
    return () => {
      socket.off("playerUpdate", handlePlayerUpdate);
      socket.off("roomRejoined");
      socket.off("error");
    };
  }, [socket, roomId]);


  useEffect(() => {
    if(players.length === 2 && players.every(p => p.ready)){
      navigate('/drawing-board');
    }
  },[players,navigate])

  const toggleReady = (playerId) => {
    const player = players.find((p) => p.userId === playerId);
    if (!player || player.userId !== userId) return; 

    const newReadyState = !player.ready;
    socket.emit("gameState", {
      roomId,
      playerId: userId,
      readyState: newReadyState,
    });
  };



  console.log("Current userId:", userId);
  console.log("Players list:", players);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold font-inter">Room: {roomId}</h1>
        {players.length === 0 ? (
          <p>Waiting for players...</p>
        ) : (
          <div>
            <p className="text-lg font-semibold">Players:</p>
            <ul className="mt-2 space-y-2">
              {players.map((player) => (
                <li
                  key={player.userId}
                  className={`flex items-center justify-between space-x-2 ${
                    player.socketId ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <div>
                  <div className="flex items-center space-x-2">
                  {player.avatar && (
                    <img
                      src={player.avatar.payload || player.avatar}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  </div>
                    <span>{player.nickname}</span>
                    <span>
                      {" "}
                      ({player.socketId ? "Connected" : "Disconnected"})
                    </span>
                    <span>
                      {" - Ready: "}
                      {player.ready ? "Yes" : "No"}
                    </span>
                  </div>
                  {player.userId === userId && (
                    <button
                      onClick={() => toggleReady(player.userId)}
                      className={`px-2 py-1 rounded ${
                        player.ready
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      } text-white`}
                    >
                      {player.ready ? "Not Ready" : "Ready"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomScreen;