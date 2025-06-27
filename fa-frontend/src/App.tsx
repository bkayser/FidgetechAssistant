import React from "react";
import { Outlet } from "react-router-dom";
import './app.css';

export default function App() {
  return (
      <div>
         <Outlet />
      </div>
  );
}