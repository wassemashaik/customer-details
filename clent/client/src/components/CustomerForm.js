
import { useEffect } from "react";
import { useState } from "react";

const CustomerForm = ({ onSubmit, initialData = {}, submitText }) => {
  const [firstName, setFirstName] = useState(initialData.first_name || "");
  const [lastName, setLastName] = useState(initialData.last_name || "");
  const [phoneNumber, setPhoneNumber] = useState(
    initialData.phone_number || ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setFirstName(initialData.first_name || "");
    setLastName(initialData.last_name || "");
    setPhoneNumber(initialData.phone_number || "");
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !phoneNumber) {
      setError("All fields are required");
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError("Phone number must be 10 digits");
      return;
    }
    setError("");
    onSubmit({
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
    });
  };
  return (
    <form onSubmit={handleSubmit} className="form-card">
      {error && <p className="error">{error}</p>}
      <div>
        <label htmlFor="firstName">First Name</label>
        <input
        id="firstName"
        type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter first name"
          required
        />
      </div>
      <div>
        <label>Last Name</label>
        <input
         type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Enter last name"
          required
        />
      </div>
      <div>
        <label>Phone Number</label>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter mobile number"
          required
        />
      </div>

      <button type="submit" className="button">
        {submitText}
      </button>
    </form>
  );
};

export default CustomerForm;
