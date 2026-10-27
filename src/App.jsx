import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { StaffLayout } from "./components/StaffLayout.jsx";
import { Spinner } from "./components/ui.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import UpdatePassword from "./pages/auth/UpdatePassword.jsx";
import Home from "./pages/public/Home.jsx";

// Staff pages load only after login, which keeps the public page fast on mobile data.
const Dashboard = lazy(() => import("./pages/staff/Dashboard.jsx"));
const Evacuees = lazy(() => import("./pages/staff/Evacuees.jsx"));
const RegisterFamily = lazy(() => import("./pages/staff/RegisterFamily.jsx"));
const Centers = lazy(() => import("./pages/staff/Centers.jsx"));
const Announcements = lazy(() => import("./pages/staff/Announcements.jsx"));
const Supplies = lazy(() => import("./pages/staff/Supplies.jsx"));
const Volunteers = lazy(() => import("./pages/staff/Volunteers.jsx"));
const Analytics = lazy(() => import("./pages/staff/Analytics.jsx"));

function Root() {
  return (
    <AuthProvider>
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/update-password", element: <UpdatePassword /> },
      {
        path: "/app",
        element: (
          <ProtectedRoute>
            <StaffLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: "evacuees", element: <Evacuees /> },
          { path: "evacuees/new", element: <RegisterFamily /> },
          { path: "centers", element: <Centers /> },
          { path: "announcements", element: <Announcements /> },
          { path: "supplies", element: <Supplies /> },
          { path: "volunteers", element: <Volunteers /> },
          { path: "analytics", element: <Analytics /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
