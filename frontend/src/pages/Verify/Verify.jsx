import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Verify.css";

// Legacy route: forward everything to cinematic success page
const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const success = searchParams.get("success");
  const cod = searchParams.get("cod");

  useEffect(() => {
    if (orderId && success !== "false") {
      navigate(`/success/${orderId}${cod ? "?cod=1" : ""}`, { replace: true });
    } else if (orderId) {
      navigate(`/success/${orderId}?failed=1`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [orderId, success, cod, navigate]);

  return (
    <div className="verify">
      <div className="spinner"></div>
    </div>
  );
};

export default Verify;
