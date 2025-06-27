import React from 'react'
import ReactDOM from 'react-dom/client'
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import App from './App'; // Your main App component
import Home from './Home'; // An example page component

// Define your routes manually
const router = createBrowserRouter([
    {
        path: "/",
        element: <App />, // Often a root layout component
        // Add child routes for different pages
        children: [
            {
                path: "/",
                element: <Home />,
            },
            // Add other routes here
            // { path: "about", element: <AboutPage /> },
        ]
    },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)