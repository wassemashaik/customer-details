const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db/db");
const port = process.env.PORT || 5000;
const app = express();
const { checkCustomerExists } = require("./db/helpers");
const catchAsync = require("./utils/catchAsync");
const AppError = require("./utils/appError");
const { count } = require("console");

app.use(cors());
app.use(express.json());

/* create a customer */
app.post(
  "/api/customers",
  catchAsync(async (req, res, next) => {
    const { first_name, last_name, phone_number } = req.body;

    if (!first_name || !last_name || !phone_number) {
      return next(
        new AppError(
          "All fields (first_name, last_name, phone_number) are required",
          400
        )
      );
    }

    if (!/^\d{10}$/.test(phone_number)) {
      return next(new AppError("Phone number must be 10 digit number", 400));
    }

    const customersql = `INSERT INTO customers (first_name, last_name, phone_number) VALUES (?, ?, ?)`;

    db.run(customersql, [first_name, last_name, phone_number], function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return next(new AppError("Phone number already exists", 400));
        }
        return next(new AppError(err.message, 400));
      }
      res.status(201).json({
        status: "success",
        data: {
          id: this.lastID,
          first_name,
          last_name,
          phone_number,
        },
      });
    });
  })
);

/* add address by customer id */
app.post(
  "/api/customers/:customerId/addresses",
  catchAsync(async (req, res, next) => {
    const { customerId } = req.params;
    const { address_details, city, state, pin_code } = req.body;

    if (!address_details || !city || !state || !pin_code) {
      return next(
        new AppError(
          "All fields (address_details, city, state, pin_code) are required",
          400
        )
      );
    }

    if (!/^[A-Za-z0-9\s-]{3,10}$/.test(pin_code)) {
      return next(
        new AppError(
          "pin code must be a 3-10 characters (letters, numbers, spaces, or dashes)",
          400
        )
      );
    }

    const exists = await checkCustomerExists(customerId);

    if (!exists) {
      return next(new AppError("Customer not found", 404));
    }

    const addressSql = `INSERT INTO addresses (customer_id, address_details, city, state, pin_code) VALUES (?, ?, ?, ?, ?)`;
    db.run(
      addressSql,
      [customerId, address_details, city, state, pin_code],
      function (err) {
        if (err) {
          return next(new AppError(err.message, 400));
        }
        res.status(201).json({
          status: "success",
          data: {
            id: this.lastID,
            customerId,
            address_details,
            city,
            state,
            pin_code,
          },
        });
      }
    );
  })
);

/* view all the customers */
app.get(
  "/api/customers",
  catchAsync(async (req, res, next) => {
    const q = (req.query.q || "").trim();
    const city = (req.query.city || "").trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const offset = (page - 1) * limit;

    const allowedSort = {
      id: "c.id",
      first_name: "c.first_name",
      last_name: "c.last_name",
      phone_number: "c.phone_number",
      city: "MIN(a.city)",
    };
    const sortParam = req.query.sort || "id";
    const sortCol = allowedSort[sortParam] || allowedSort.id;
    const order =
      (req.query.order || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

    const whereClauses = [];
    const filterParams = [];

    if (q) {
      whereClauses.push(
        `(c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone_number LIKE ?)`
      );
      filterParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (city) {
      whereClauses.push(`a.city LIKE ?`);
      filterParams.push(`%${city}%`);
    }

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const sqlQuery = `
      SELECT c.id as customer_id, c.first_name, c.last_name, c.phone_number, 
      GROUP_CONCAT(
      a.id || '::' || a.address_details || '::' || a.city || '::' || a.state || '::' || a.pin_code 
      )AS addresses,
      MIN(a.city) AS city_for_sort
      FROM customers c 
      LEFT JOIN addresses a ON c.id = a.customer_id
      ${whereSql}
      GROUP by c.id
      ORDER BY ${sortCol} ${order}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      LEFT JOIN addresses a ON c.id = a.customer_id
      ${whereSql}
    `;

    db.get(countQuery, filterParams, (err, countRow) => {
      if (err) return next(new AppError(err.message, 400));

      const total = countRow.total;
      const paginatedParams = [...filterParams, limit, offset];
      db.all(sqlQuery, paginatedParams, (err, rows) => {
        if (err) return next(new AppError(err.message, 400));

        const customers = rows.map((row) => {
          const addresses = row.addresses
            ? row.addresses.split(",").map((str) => {
                const [id, address_details, city, state, pin_code] =
                  str.split("::");
                return { id, address_details, city, state, pin_code };
              })
            : [];
          return {
            id: row.customer_id,
            first_name: row.first_name,
            last_name: row.last_name,
            phone_number: row.phone_number,
            addresses,
          };
        });

        res.status(200).json({
          status: "success",
          data: {
            customers,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
          },
        });
      });
    });
  })
);

/* get customer details */
app.get(
  "/api/customers/:id",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const customerSql = `SELECT * FROM customers WHERE id = ?`;
    const addressSql = `SELECT * FROM addresses WHERE customer_id = ?`;
    db.get(customerSql, [id], (err, customer) => {
      if (err) {
        return next(new AppError(err.message, 400));
      }
      if (!customer) {
        return next(new AppError("Customer not found", 400));
      }

      db.all(addressSql, [id], (err, addresses) => {
        if (err) {
          console.error("DB error:", err.message);
          return next(new AppError(err.message, 400));
        }

        res.status(200).json({
          status: "success",
          data: { ...customer, addresses: addresses || [] },
        });
      });
    });
  })
);

/* edit customer by id */
app.patch(
  "/api/customers/:id",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { first_name, last_name, phone_number } = req.body;

    const fields = [];
    const values = [];
    if (first_name !== undefined) {
      if (!first_name.trim()) {
        return next(new AppError("first name cannot be empty", 400));
      }
      fields.push("first_name = ?");
      values.push(first_name);
    }
    if (last_name !== undefined) {
      if (!last_name.trim()) {
        return next(new AppError("last name cannot be empty", 400));
      }
      fields.push("last_name = ?");
      values.push(last_name);
    }
    if (phone_number !== undefined) {
      if (!/^\d{10}$/.test(phone_number)) {
        return next(
          new AppError("Phone number must be 1 10-digit number", 400)
        );
      }
      fields.push("phone_number = ?");
      values.push(phone_number);
    }

    if (fields.length === 0) {
      return next(new AppError("No fields provided to update", 400));
    }

    const sql = `UPDATE customers SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    db.run(sql, values, function (err) {
      if (err) {
        return next(new AppError(err.message, 400));
      }
      if (this.changes === 0) {
        return next(new AppError("Customer not found", 400));
      }

      const customerSql = `SELECT * FROM customers where id = ?`;
      const addressSql = `SELECT * FROM addresses WHERE customer_id =?`;

      db.get(customerSql, [id], (err, customer) => {
        if (err) {
          return next(new AppError(err.message, 400));
        }
        db.all(addressSql, [id], (err, addresses) => {
          if (err) {
            return next(new AppError(err.message, 400));
          }
          res.status(200).json({
            ...customer,
            addresses: addresses || [],
          });
        });
      });
    });
  })
);

/* edit address of customer */
app.patch(
  "/api/customers/:customerId/addresses/:addressId",
  catchAsync(async (req, res, next) => {
    const { customerId, addressId } = req.params;
    const { address_details, city, state, pin_code } = req.body;

    const fields = [];
    const values = [];

    // checking whether the input value is empty
    if (address_details !== undefined) {
      if (!address_details.trim()) {
        return next(new AppError("Address details cannot be empty", 400));
      }
      fields.push("address_details = ?");
      values.push(address_details);
    }
    if (city !== undefined) {
      if (!city.trim()) {
        return next(new AppError("city cannot be empty", 400));
      }
      fields.push("city = ?");
      values.push(city);
    }
    if (state !== undefined) {
      if (!state.trim()) {
        return next(new AppError("State cannot be empty", 400));
      }
      fields.push("state = ?");
      values.push(state);
    }
    if (pin_code !== undefined) {
      if (!/^[A-Za-z0-9\s-]{3,10}$/.test(pin_code)) {
        return next(
          new AppError(
            "pin code must be a 3-10 characters (letters, numbers, spaces, or dashes)",
            400
          )
        );
      }
      fields.push("pin_code = ?");
      values.push(pin_code);
    }

    if (fields.length === 0) {
      return next(new AppError("No field provided to update", 400));
    }
    const exists = await checkCustomerExists(customerId);

    if (!exists) {
      return next(new AppError("Customer not found", 400));
    }

    const sql = `UPDATE addresses SET ${fields.join(
      ", "
    )} WHERE id = ? AND customer_id = ?`;
    values.push(addressId, customerId);

    db.run(sql, values, function (err) {
      if (err) {
        return next(new AppError(err.message, 400));
      }
      if (this.changes === 0) {
        return next(new AppError("Address not found for this customer"));
      }

      const addressQuery = `SELECT * FROM addresses WHERE id = ? AND customer_id = ?`;

      db.get(addressQuery, [addressId, customerId], (err, updatedAddress) => {
        if (err) {
          return next(new AppError(err.message, 400));
        }
        res.status(200).json({
          status: "success",
          data: updatedAddress,
        });
      });
    });
  })
);

/* Delete customer */
app.delete(
  "/api/customers/:id",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const deleteCustomerSql = `DELETE FROM customers WHERE id = ?`;
    db.run(deleteCustomerSql, [id], function (err) {
      if (err) {
        return next(new AppError(err.message, 400));
      }

      if (this.changes === 0) {
        return next(new AppError("Customer not found", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          message: "Customer and associated addresses deleted successfully",
        },
      });
    });
  })
);

/* delete address */
app.delete(
  "/api/addresses/:id",
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const sql = `DELETE FROM addresses WHERE id = ?`;
    db.run(sql, [id], function (err) {
      if (err) {
        return next(new AppError(err.message, 400));
      }

      if (this.changes === 0) {
        return next(new AppError("Address not found", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          message: "Address deleted successfully",
        },
      });
    });
  })
);

app.listen(port, () => {
  console.log(`Server running at port: ${port}`);
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});
