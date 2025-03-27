import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import HomeScreen from "./components/HomeScreen";
import RoomScreen from "./components/RoomScreen";

const App = () => {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/:roomId" element={<RoomScreen />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
};

export default App;
