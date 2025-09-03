import React from "react";
import CustomerList from "../components/CustomerList";

function CustomerListPage() {
  return (
    <div>
      <div className="page">
        <h2>All Customers</h2>
        <CustomerList />
      </div>
    </div>
  );
}

export default CustomerListPage;
