import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CustomerForm from "../components/CustomerForm";

const EditCustomerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      const response = await fetch(`http://localhost:5000/api/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.data);
      } else {
        console.error("Failed to load customer");
      }
    };
    fetchCustomer();
  }, [id]);

  const handleEdit = async (formData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update customer");
      await response.json();

      navigate(`/customer/${id}`); // redirect to details page
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (!customer) return <p>Loading...</p>;

  return (
    <div>
      <h2>Edit Customer</h2>
      <CustomerForm
        onSubmit={handleEdit}
        initialData={customer}
        submitText="Update Customer"
      />
    </div>
  );
};

export default EditCustomerPage;
