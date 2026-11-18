import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { StaffLayout } from "./components/StaffLayout.jsx";
import { Spinner } from "./components/ui.jsx";
import { UpdateBanner } from "./components/UpdateBanner.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
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

// Someone who opened a password-reset link must choose a new password first,
// even when Supabase sent them to the home page instead of /update-password
// (it does that when the address isn't in its list of allowed Redirect URLs).
// Waits until loading is done so Supabase has read the link before we navigate.
function RecoveryRedirect() {
  const { loading, recovering } = useAuth();
  const { pathname } = useLocation();
  if (!loading && recovering && pathname !== "/update-password") return <Navigate to="/update-password" replace />;
  return null;
}

function Root() {
  return (
    <AuthProvider>
      <RecoveryRedirect />
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
      <UpdateBanner />
    </AuthProvider>
  );
}

// Shown instead of a blank or technical error page. The most common cause is a
// new version being deployed while the page was open (old files are gone), and
// reloading fixes that.
function RouteError() {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-xl font-extrabold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">
          The page couldn't load. This usually happens right after the app is updated. Reloading should fix it.
        </p>
        <button className="btn-primary mt-5" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </main>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
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
