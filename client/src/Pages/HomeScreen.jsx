import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import avatars from "../../avatars";
import AvatarSelect from "../components/AvatarSelect";
import GameOptions from "../components/GameOptions";
import Themes from "../../themes";

const HomeScreen = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [theme, setTheme] = useState("");
  const themes = ["Animals", "Space", "Food"];

  useEffect(() => {
    if (!socket) return;

    socket.on("roomCreated", ({ roomId, userId }) => {
      localStorage.setItem("userId", userId);
      navigate(`/${roomId}`);
    });

    socket.on("roomJoined", ({ roomId, userId }) => {
      localStorage.setItem("userId", userId);
      navigate(`/${roomId}`);
    });

    socket.on("error", ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("error");
    };
  }, [socket, navigate]);

  const handleCreateRoom = () => {

    console.log('Create Room clicked with:', {
      nickname,
      selectedAvatar,
      theme
    });

    if (!nickname || !selectedAvatar || !theme) {
      alert("Please select a nickname, avatar, and theme");
      return;
    }
    socket.emit("createRoom", { nickname, theme, avatar: selectedAvatar });
  };

  const handleJoinRoom = () => {
    if (!nickname || !selectedAvatar || !roomIdInput) {
      alert("Please enter a nickname, avatar, and room code");
      return;
    }
    const storedUserID = localStorage.getItem("userJoineId");
    socket.emit("joinRoom", {
      roomId: roomIdInput,
      nickname,
      avatar: selectedAvatar,
      userId: storedUserID,
    });
  };

  // console.log(selectedAvatar)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 md:w-1/2">
        <h1 className="text-2xl font-bold mb-4 text-center">Get Set Draww!!</h1>

        <div className="flex justify-center">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="and you are called?"
            className="w-9/12 p-2 mb-4 border rounded"
          />
        </div>

        <div className="mb-4">
          <div className="mt-10">
            <AvatarSelect
              avatars={avatars}
              selectedAvatar={selectedAvatar}
              setSelectedAvatar={setSelectedAvatar}
            />
          </div>
        </div>

        <div className="flex justify-center">
        <button
          onClick={() => setShowPopup(true)}
          className="w-1/2 bg-blue-500 font-bold font-primary text-2xl text-white p-2 rounded hover:bg-blue-600"
        >
          Start
        </button>
        </div>

        {showPopup && <GameOptions theme={theme} themes={Themes} setTheme={setTheme} roomIdInput={roomIdInput} setRoomIdInput={setRoomIdInput} handleCreateRoom={handleCreateRoom} handleJoinRoom={handleJoinRoom} onClose={()=> setShowPopup(false)}/>}
      {/* </div> */}

{/* {showPopup && (

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

 */}
      </div>
    </div>
  );
};

export default HomeScreen;
