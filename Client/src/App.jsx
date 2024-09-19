import "./App.css";
import { io } from "socket.io-client";
function App() {
  const server = io("https://localhost:8000");
  console.log("server:", server);
  return <div>Hello</div>;
}

export default App;
