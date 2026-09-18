import { useContext, useState } from "react";
import Home from "./pages/Home/Home";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Cart from "./pages/Cart/Cart";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import OtpGate from "./components/OtpGate/OtpGate";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import MyOrders from "./pages/MyOrders/MyOrders";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Verify from "./pages/Verify/Verify";
import { StoreContext } from "./Context/StoreContext";

const App = () => {
  const { token, showLogin, setShowLogin } = useContext(StoreContext);
  // start gate: shown until logged in via OTP or skipped once
  const [gateOpen, setGateOpen] = useState(
    () => !localStorage.getItem("token") && !sessionStorage.getItem("ab_skipped")
  );

  const gateDone = (loggedIn) => {
    if (!loggedIn) sessionStorage.setItem("ab_skipped", "1");
    setGateOpen(false);
  };

  if (gateOpen && !token) {
    return (
      <>
        <ToastContainer />
        <OtpGate onDone={gateDone} />
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <div className="app">
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/verify" element={<Verify />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
};

export default App;
