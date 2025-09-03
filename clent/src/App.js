import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import "./App.css";
import CustomerListPage from "./pages/CustomerListPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import Header from "./components/Header";
import AddCustomerFormPage from "./pages/AddCustomerFormPage";
import EditCustomerPage from "./pages/EditCustomerPage";
import AddressForm from "./components/AddressForm";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route exact path="/" element={<CustomerListPage />} />
            <Route
              exact
              path="/customer/:id"
              element={<CustomerDetailPage />}
            />
            <Route exact path="/add" element={<AddCustomerFormPage />} />
            <Route exact path="/edit/:id" element={<EditCustomerPage />} />
            <Route
              exact
              path="/customers/:id/add-address"
              element={<AddressForm />}
            />
          </Routes>
        </main>
        <footer className="footer">
          © 2025 Customer Management Made by Wassema
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
