import { StrictMode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
