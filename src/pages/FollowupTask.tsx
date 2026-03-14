import { Navigate, useParams } from "react-router-dom";

const FollowupTask = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/interaction/${id}`} replace />;
};

export default FollowupTask;
