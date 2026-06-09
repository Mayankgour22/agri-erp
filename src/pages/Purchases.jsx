import React, { useState, useEffect } from "react";
import { Plus, Search, Trash, Eye, X, Calendar } from "lucide-react";

const Purchases = ({ user }) => {
  const [purchases, setPurchases] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState(null);

  // New Purchase Form state
  const [company, setCompany] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState([
    {
      product: "",
      batchNumber: "",
      expiryDate: "",
      quantity: 1,
      rate: 0,
      gstPercentage: 18,
      total: 0,
    },
  ]);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const purRes = await fetch("/api/purchases", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const purData = await purRes.json();
      setPurchases(purData);

      const compRes = await fetch("/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const compData = await compRes.json();
      setCompanies(compData);
      if (compData.length > 0) setCompany(compData[0]._id);

      const prodRes = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prodData = await prodRes.json();
      setProducts(prodData);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching procurement details:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        product: "",
        batchNumber: "",
        expiryDate: "",
        quantity: 1,
        rate: 0,
        gstPercentage: 18,
        total: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;

    // If product changes, pre-fill rate and gst percentage from product model
    if (field === "product") {
      const selectedProd = products.find((p) => p._id === val);
      if (selectedProd) {
        newItems[idx].rate = selectedProd.purchasePrice;
        newItems[idx].gstPercentage = selectedProd.gstPercentage;
      }
    }

    // Calculate item total
    const qty = parseFloat(newItems[idx].quantity) || 0;
    const rate = parseFloat(newItems[idx].rate) || 0;
    const gstRate = parseFloat(newItems[idx].gstPercentage) || 0;

    const baseVal = qty * rate;
    const gstAmount = baseVal * (gstRate / 100);
    newItems[idx].total = baseVal + gstAmount;

    setItems(newItems);
  };

  // Aggregated totals
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + qty * rate;
  }, 0);

  const gstTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const gstRate = parseFloat(item.gstPercentage) || 0;
    return sum + qty * rate * (gstRate / 100);
  }, 0);

  const grandTotal = subtotal + gstTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!company || !invoiceNumber) {
      setError("Manufacturer and Invoice Number are required.");
      return;
    }

    const invalidItem = items.some(
      (item) =>
        !item.product ||
        !item.batchNumber ||
        !item.expiryDate ||
        item.quantity <= 0 ||
        item.rate <= 0,
    );
    if (invalidItem) {
      setError(
        "Please fill all item lines completely. Batch Number, Expiry, Qty and Cost must be valid.",
      );
      return;
    }

    // Format items payload
    const itemsPayload = items.map((item) => {
      const qty = parseFloat(item.quantity);
      const rate = parseFloat(item.rate);
      const base = qty * rate;
      const gstAmt = base * (item.gstPercentage / 100);
      return {
        product: item.product,
        quantity: qty,
        rate: rate,
        gstPercentage: item.gstPercentage,
        gstAmount: gstAmt,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        total: item.total,
      };
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company,
          invoiceNumber,
          items: itemsPayload,
          subtotal,
          gstTotal,
          grandTotal,
          date,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
        // Reset states
        setInvoiceNumber("");
        setDate(new Date().toISOString().split("T")[0]);
        setItems([
          {
            product: "",
            batchNumber: "",
            expiryDate: "",
            quantity: 1,
            rate: 0,
            gstPercentage: 18,
            total: 0,
          },
        ]);
      } else {
        const errData = await res.json();
        setError(errData.message || "Error processing purchase");
      }
    } catch (err) {
      setError("Server connection failure");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "4px" }}>
            Purchases & Stock Inward
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Record product import receipts from manufacturers, specify
            batches/expiry, and auto-increase inventory stock.
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "manager") && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} /> New Purchase Entry
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading purchases...
        </div>
      ) : (
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Manufacturer</th>
                <th>Invoice Number</th>
                <th>Subtotal</th>
                <th>GST Total</th>
                <th>Grand Total</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p._id}>
                  <td>{new Date(p.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: "600" }}>
                    {p.company?.name || "Unknown"}
                  </td>
                  <td style={{ fontFamily: "monospace", fontWeight: "bold" }}>
                    {p.invoiceNumber}
                  </td>
                  <td>₹{p.subtotal.toLocaleString("en-IN")}</td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    ₹{p.gstTotal.toLocaleString("en-IN")}
                  </td>
                  <td style={{ fontWeight: "600", color: "var(--accent)" }}>
                    ₹{p.grandTotal.toLocaleString("en-IN")}
                  </td>
                  <td>
                    <button
                      onClick={() => setViewingPurchase(p)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Eye size={16} /> View Item List
                    </button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      color: "var(--text-secondary)",
                      padding: "24px",
                    }}
                  >
                    No purchase history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Purchase Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "850px", width: "95%" }}
          >
            <div className="modal-header">
              <h3>Inward Purchase Bill Entry</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                className="modal-body"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {error && (
                  <div
                    style={{
                      color: "var(--danger)",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Manufacturer Company *</label>
                    <select
                      className="filter-select"
                      style={{ width: "100%" }}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      required
                    >
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Supplier Invoice Number *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. BY/2026/089"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Invoice Line Items
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      + Add Item Row
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      maxHeight: "250px",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "2fr 1.2fr 1.2fr 1fr 1fr 1.2fr 40px",
                          gap: "10px",
                          alignItems: "end",
                          borderBottom: "1px solid var(--border-color)",
                          paddingBottom: "12px",
                        }}
                      >
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label
                            className="form-label"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Select Dawai SKU
                          </label>
                          <select
                            className="filter-select"
                            style={{ width: "100%", padding: "8px" }}
                            value={item.product}
                            onChange={(e) =>
                              handleItemChange(idx, "product", e.target.value)
                            }
                            required
                          >
                            <option value="">-- Choose --</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label
                            className="form-label"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Batch Number
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: "8px" }}
                            placeholder="e.g. B-902"
                            value={item.batchNumber}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "batchNumber",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label
                            className="form-label"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: "8px" }}
                            value={item.expiryDate}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "expiryDate",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label
                            className="form-label"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Qty
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: "8px" }}
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "quantity",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            required
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label
                            className="form-label"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Cost Price (₹)
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: "8px" }}
                            min="0"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "rate",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            required
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                              display: "block",
                              marginBottom: "8px",
                            }}
                          >
                            GST Tax ({item.gstPercentage}%)
                          </span>
                          <span
                            style={{
                              fontWeight: "600",
                              fontSize: "0.9rem",
                              display: "block",
                              paddingBottom: "8px",
                            }}
                          >
                            ₹{item.total ? item.total.toFixed(2) : "0.00"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--danger)",
                            cursor: "pointer",
                            marginBottom: "10px",
                          }}
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "250px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span>GST Amount:</span>
                      <span>₹{gstTotal.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        borderTop: "1px dashed var(--border-color)",
                        paddingTop: "8px",
                      }}
                    >
                      <span>Grand Total:</span>
                      <span style={{ color: "var(--accent)" }}>
                        ₹{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Log Procurement (Stock-In)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingPurchase && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "650px" }}>
            <div className="modal-header">
              <h3>Purchase Bill Details</h3>
              <button
                onClick={() => setViewingPurchase(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "20px",
                  fontSize: "0.9rem",
                }}
              >
                <div>
                  <span
                    style={{ color: "var(--text-secondary)", display: "block" }}
                  >
                    Manufacturer:
                  </span>
                  <strong>{viewingPurchase.company?.name}</strong>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    GST: {viewingPurchase.company?.gstNumber}
                  </span>
                </div>
                <div>
                  <span
                    style={{ color: "var(--text-secondary)", display: "block" }}
                  >
                    Invoice Number:
                  </span>
                  <strong>{viewingPurchase.invoiceNumber}</strong>
                  <span style={{ display: "block", fontSize: "0.8rem" }}>
                    Date: {new Date(viewingPurchase.date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <h4
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                Purchased Items
              </h4>

              <div
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <table
                  className="responsive-table"
                  style={{ fontSize: "0.85rem" }}
                >
                  <thead style={{ backgroundColor: "var(--bg-surface-hover)" }}>
                    <tr>
                      <th style={{ padding: "10px 16px" }}>Product</th>
                      <th style={{ padding: "10px 16px" }}>Batch</th>
                      <th style={{ padding: "10px 16px" }}>Qty</th>
                      <th style={{ padding: "10px 16px" }}>Cost</th>
                      <th style={{ padding: "10px 16px" }}>Total (w/ GST)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingPurchase.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: "10px 16px", fontWeight: "600" }}>
                          {item.product?.name || "Deleted Product"}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontFamily: "monospace",
                          }}
                        >
                          {item.batchNumber}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: "10px 16px" }}>₹{item.rate}</td>
                        <td
                          style={{ padding: "10px 16px", fontWeight: "bold" }}
                        >
                          ₹{item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    width: "220px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.85rem",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyBetween: "space-between" }}
                  >
                    <span
                      style={{ color: "var(--text-secondary)", flexGrow: 1 }}
                    >
                      Subtotal:
                    </span>
                    <span>₹{viewingPurchase.subtotal}</span>
                  </div>
                  <div
                    style={{ display: "flex", justifyBetween: "space-between" }}
                  >
                    <span
                      style={{ color: "var(--text-secondary)", flexGrow: 1 }}
                    >
                      GST:
                    </span>
                    <span>₹{viewingPurchase.gstTotal}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyBetween: "space-between",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      borderTop: "1px dashed var(--border-color)",
                      paddingTop: "6px",
                      marginTop: "4px",
                    }}
                  >
                    <span style={{ flexGrow: 1 }}>Total Bill:</span>
                    <span style={{ color: "var(--accent)" }}>
                      ₹{viewingPurchase.grandTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={() => setViewingPurchase(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
