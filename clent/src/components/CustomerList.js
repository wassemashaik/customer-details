import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState("asc");
  const navigate = useNavigate()
   const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  });

  const getCustomers = async (pageNum = 1) => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("q", search);
      if (cityFilter) queryParams.append("city", cityFilter);
      queryParams.append("sort", sort);
      queryParams.append("order", order);
      queryParams.append("page", page);
      queryParams.append("limit", limit);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}?${queryParams.toString()}`
      );
      console.log(response);
      if (!response.ok) throw new Error("Failed to fetch customers");
      const result = await response.json();

      setCustomers(result.data.customers);
      setPagination(result.data.pagination)
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getCustomers(page);
  }, [search, cityFilter, page, sort, order]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div>
      {/* search & filter */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search by name, phone"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <input
          type="text"
          placeholder="Filter by city"
          value={cityFilter}
          onChange={(e) => {
            setCityFilter(e.target.value);
            setPage(1);
          }}
        />
        <button
          className="button"
          onClick={() => {
            setSearch("");
            setCityFilter("");
            setPage(1);
            getCustomers();
          }}
        >
          Clear Filters
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="id">ID</option>
          <option value="first_name">First Name</option>
          <option value="last_name">Last Name</option>
          <option value="phone_number">Phone</option>
          <option value="city">City</option>
        </select>

        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      {/* customer cards */}
      <div className="card-list">
        {customers.map((customer) => (
          <div className="card" key={customer.id}>
            <h3>
              {customer.first_name} {customer.last_name}
            </h3>
            <p>📞 {customer.phone_number}</p>
            {/* render address */}
            {customer.addresses.length === 0 ? (
              <button
                onClick={() =>
                  navigate(`/customers/${customer.id}/add-address`)
                }
                className="button"
              >
                + Add Address
              </button>
            ) : (
              <>
                <button
                  className="button toggle-btn"
                  onClick={() => toggleExpand(customer.id)}
                >
                  {expanded[customer.id] ? "Hide Addresses" : "Show Addresses"}
                </button>

                <div
                  className={`addresses ${
                    expanded[customer.id] ? "expanded" : ""
                  }`}
                >
                  {customer.addresses.map((addr) => (
                    <p key={addr.id}>
                      {addr.address_details}, {addr.city}, {addr.state} -{" "}
                      {addr.pin_code}
                    </p>
                  ))}
                </div>
              </>
            )}
            <div className="btn-group">
              <Link to={`/customer/${customer.id}`} className="btn">
                View Details
              </Link>
              <Link to={`/edit/${customer.id}`} className="btn secondary">
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            👈🏼 Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Next 👉🏼
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
