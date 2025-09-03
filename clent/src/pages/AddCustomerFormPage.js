import React from "react";
import { useNavigate } from "react-router-dom";
import CustomerForm from '../components/CustomerForm'

const AddCustomerFormPage = () => {
  const navigate = useNavigate();

  const handleAdd = async (formData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add customer");
      await response.json();

      navigate("/"); // redirect back to list
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Add Customer</h2>
      <CustomerForm  onSubmit={handleAdd} submitText="Create Customer" initialData={{}} />
    </div>
  );
};

export default AddCustomerFormPage;
