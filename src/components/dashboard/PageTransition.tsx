import { useLocation, Outlet } from "react-router-dom";

export function PageTransition() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in">
      <Outlet />
    </div>
  );
}
