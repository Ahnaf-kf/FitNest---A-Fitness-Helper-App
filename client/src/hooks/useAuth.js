// client/src/hooks/useAuth.js
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("fitnest_token");
    localStorage.removeItem("fitnest_user");
    navigate("/authflow", { replace: true });
  };

  return { logout };
}
