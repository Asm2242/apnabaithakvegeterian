import { useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import "./Verify.css";

const Verify = () => {
  const { setCartItems } = useContext(StoreContext);
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const cod = searchParams.get("cod");

  const navigate = useNavigate();

  useEffect(() => {
    // COD orders skip payment verification entirely
    if (cod === "1" && orderId) {
      setCartItems({});
      navigate("/myorders");
      return;
    }
    if (success === "false" || !orderId) {
      navigate("/");
      return;
    }
    // online payments are verified in checkout handler; just show orders
    setCartItems({});
    navigate("/myorders");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, orderId, cod]);

  return (
    <div className="verify">
      <div className="spinner"></div>
    </div>
  );
};

export default Verify;
