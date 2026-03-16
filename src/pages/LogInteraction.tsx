import { Navigate, useSearchParams } from "react-router-dom";

const LogInteraction = () => {
  const [searchParams] = useSearchParams();
  const contact = searchParams.get("contact");
  // Redirect to home — the log flow now lives in bottom sheets
  return <Navigate to={contact ? `/contact/${contact}` : "/"} replace />;
};

export default LogInteraction;
