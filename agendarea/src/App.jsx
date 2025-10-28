import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Header from "./components/Header";
import BookingForm from "./components/BookingForm";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <nav className="text-center mt-4">
        <Link to="/" className="mx-2 text-pink-500 font-semibold">Agendar</Link>
        <Link to="/admin" className="mx-2 text-gray-600 hover:text-pink-500">Administração</Link>
      </nav>

      <Routes>
        <Route path="/" element={<BookingForm />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
