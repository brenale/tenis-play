// import { Home } from "./components/Home";

// function App() {
//   return <Home />;
// }

// export default App;


import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./components/Home";
import { Reservas } from "./components/Reservas";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reservas" element={<Reservas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
