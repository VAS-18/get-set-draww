import React, { useEffect, useState } from 'react'
import { useSocket } from '../context/SocketContext'
import { useParams } from 'react-router-dom';

const DrawingState = () => {
    const socket = useSocket();
    const { roomId } = useParams();
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        if(!socket) return;
    
        // Request initial players data
        socket.emit('getPlayers', { roomId });
    
        socket.on("playerUpdate", (data) => {
            console.log("Received player update:", data);
            if (data && Array.isArray(data.players)) {
                setPlayers(data.players);
                console.log("Updated players array:", data.players);
            }
        });
    
        socket.on("error", (error) => {
            console.error("Socket error:", error);
        });
       
        return () => {
            socket.off("playerUpdate");
            socket.off("error");
        };
    }, [socket, roomId]); 

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Players</h2>
            <div className="space-y-4">
                {Array.isArray(players) && players.map((player) => (
                    <div 
                        key={player.userId} 
                        className="flex items-center space-x-3 p-2 border rounded-lg"
                    >
                        {player.avatar && (
                            <div className="relative">
                                <img
                                    src={player.avatar.payload || player.avatar}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full"
                                />
                                <span 
                                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white
                                        ${player.isDrawing ? 'bg-green-500' : 'bg-gray-300'}`}
                                />
                            </div>
                        )}
                        <div>
                            <p className="font-semibold">{player.nickname}</p>
                            <p className="text-sm text-gray-500">
                                {player.isDrawing ? 'Drawing' : 'Waiting'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DrawingState