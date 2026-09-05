import { useLocation } from "react-router-dom";

export default function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.split("/").pop() || "Page";
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold capitalize mb-2">{pageName}</h1>
        <p className="text-muted-foreground">This feature is coming soon.</p>
      </div>
    </div>
  );
}
