import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import HomeScreen from "./Pages/HomeScreen";
import RoomScreen from "./Pages/RoomScreen";
import DrawingPage from "./Pages/DrawingPage";

const App = () => {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/:roomId" element={<RoomScreen />} />
          <Route path="/drawing/:roomId" element={<DrawingPage/>} />
        </Routes>
      </Router>
    </SocketProvider>
  );
};

export default App;
