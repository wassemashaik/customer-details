import { useEffect } from "react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const AddressForm = ({ onSubmit, initialData = {}, submitText = "Save" }) => {
  const { id } = useParams(); // customer id
  const navigate = useNavigate();
  const [form, setForm] = useState({
    address_details: "",
    city: "",
    state: "",
    pin_code: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        address_details: initialData.address_details || "",
        city: initialData.city || "",
        state: initialData.state || "",
        pin_code: initialData.pin_code || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSubmit(form)
  };

  return (
    <div className="address-form-container">
      <h2>{submitText}</h2>
      <form className="address-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="address_details"
          placeholder="Address Details"
          value={form.address_details}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="state"
          placeholder="State"
          value={form.state}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="pin_code"
          placeholder="Pin Code"
          value={form.pin_code}
          onChange={handleChange}
          required
        />
        <button className="button" type="submit">
          {submitText}
        </button>
      </form>
    </div>
  );
};

export default AddressForm;
