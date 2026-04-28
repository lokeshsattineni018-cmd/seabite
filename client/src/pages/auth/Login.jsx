import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/?auth=login", { replace: true });
  }, [navigate]);

  return null;
}