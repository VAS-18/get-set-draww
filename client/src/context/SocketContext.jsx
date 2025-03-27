import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:3000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    //connection success
    newSocket.on("connect", () => {
      console.log("Socket connected successfully");
      setSocket(newSocket);
    });

    //connection-error
    newSocket.on("connect-error", (error) => {
      console.error("Socket connection error:", error);
      setSocket(null);
    });

    //clean up
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
};

export const useSocket = ()=>{
  const context = useContext(SocketContext);

  if(context === undefined){
    throw new Error('useSocket must be used within a Socket Provider');
  }

  return context;
}
