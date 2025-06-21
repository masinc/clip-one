import { Outlet } from "react-router";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ActionsProvider } from "./contexts/ActionsContext";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <ActionsProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Outlet />
        </div>
      </ActionsProvider>
    </ThemeProvider>
  );
}

export default App;
