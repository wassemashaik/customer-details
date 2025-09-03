import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AddressForm from "../components/AddressForm";

const CustomerDetailPage = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/customers/${id}`
        );
        if (!response.ok) throw new Error("Failed to fetch customer details");
        const data = await response.json();
        setCustomer(data.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  const handleAddAddress = async (formData) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/customers/${id}/addresses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      if (!response.ok) throw new Error("Failed to add address");
      const data = await response.json();
      console.log(data);
      setCustomer((prev) => ({
        ...prev,
        addresses: [...prev.addresses, data.data],
      }));
      setShowAddressForm(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateAddress = async (customerId, addressId, formData) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/customers/${customerId}/addresses/${addressId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      if (!res.ok) throw new Error("Failed to update address");
      const data = await res.json();
      setCustomer({
        ...customer,
        addresses: customer.addresses.map((a) =>
          a.id === addressId ? data.data : a
        ),
      });

      setEditingAddress(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Delete this address?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/addresses/${addressId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete address");

      setCustomer((prev) => ({
        ...prev,
        addresses: prev.addresses.filter((a) => a.id !== addressId),
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!window.confirm("Delete this customer?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/customers/${id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete customer");

      navigate("/"); // redirect after delete
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!customer) return <p>No customer found.</p>;

  return (
    <div className="customer-card">
      <h2>
        {customer.first_name} {customer.last_name}
      </h2>
      <p>📞 {customer.phone_number}</p>
      <h3>Addresses:</h3>
      {customer.addresses.length > 0 ? (
        <ul className="address-list">
          {customer.addresses.map((addr) => (
            <li key={addr.id} className="address-item">
              <span>
                {addr.address_details}, {addr.city}, {addr.state} -{" "}
                {addr.pin_code}
              </span>
              <div className="actions">
                <button
                  className="button small"
                  onClick={() => setEditingAddress(addr)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="button small danger"
                  onClick={() => handleDeleteAddress(addr.id)}
                >
                  🗑 Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No addresses found.</p>
      )}
      {editingAddress ? (
        <AddressForm
          initialData={editingAddress}
          onSubmit={(formData) =>
            handleUpdateAddress(customer.id, editingAddress.id, formData)
          }
          submitText="Update Address"
        />
      ) : (
        <>
          <button
            className="button"
            onClick={() => setShowAddressForm(!showAddressForm)}
          >
            {showAddressForm ? "Cancel" : "➕ Add Address"}
          </button>
          {showAddressForm && (
            <AddressForm
              onSubmit={handleAddAddress}
              submitText="Add Address"
              initialData={{}}
            />
          )}
        </>
      )}
      <div className="footer-buttons">
        <Link to="/" className="button">
          ⬅️ Back
        </Link>
        <button className="button danger" onClick={handleDeleteCustomer}>
          🗑 Delete Customer
        </button>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
