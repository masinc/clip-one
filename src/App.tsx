import { Outlet } from "react-router";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  );
}

export default App;
