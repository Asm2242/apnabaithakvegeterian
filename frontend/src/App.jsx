import { useContext, useState } from "react";
import Home from "./pages/Home/Home";
import Footer from "./components/Footer/Footer";
import Feedback from "./components/Feedback/Feedback";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Cart from "./pages/Cart/Cart";
import Wishlist from "./pages/Wishlist/Wishlist";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import OtpGate from "./components/OtpGate/OtpGate";
import LocationGate from "./components/LocationGate/LocationGate";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import MyOrders from "./pages/MyOrders/MyOrders";
import Profile from "./pages/Profile/Profile";
import Track from "./pages/Track/Track";
import Menu from "./pages/Menu/Menu";
import OrderSuccess from "./pages/OrderSuccess/OrderSuccess";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Verify from "./pages/Verify/Verify";
import { StoreContext } from "./Context/StoreContext";
import Splash from "./components/Splash/Splash";
import ScrollTop from "./components/ScrollTop/ScrollTop";
import NotFound from "./pages/NotFound/NotFound";
import MobileCartBar from "./components/MobileCartBar/MobileCartBar";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";

const App = () => {
  const { token, showLogin, setShowLogin, theme } = useContext(StoreContext);
  // start gate: shown until logged in via OTP or skipped once
  const [gateOpen, setGateOpen] = useState(
    () => !localStorage.getItem("token") && !sessionStorage.getItem("ab_skipped")
  );

  const gateDone = (loggedIn) => {
    if (!loggedIn) sessionStorage.setItem("ab_skipped", "1");
    setGateOpen(false);
    // first-open location gate (once ever)
    if (!localStorage.getItem("ab_loc_asked")) {
      setLocGate(true);
    }
  };
  const [locGate, setLocGate] = useState(false);
  // branded intro — once per browser session
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem("ab_intro")
  );
  const finishSplash = () => {
    sessionStorage.setItem("ab_intro", "1");
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <>
        <ToastContainer theme={theme} />
        <Splash onDone={finishSplash} />
      </>
    );
  }

  if (gateOpen && !token) {
    return (
      <>
        <ToastContainer theme={theme} />
        <OtpGate onDone={gateDone} />
      </>
    );
  }

  if (locGate) {
    return (
      <>
        <ToastContainer theme={theme} />
        <LocationGate onDone={() => setLocGate(false)} />
      </>
    );
  }

  return (
    <>
      <ToastContainer theme={theme} />
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <main className="app">
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/track/:id" element={<Track />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/success/:id" element={<OrderSuccess />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <ScrollTop />
      <MobileCartBar />
      <Feedback />
      <Footer />
    </>
  );
};

export default App;
