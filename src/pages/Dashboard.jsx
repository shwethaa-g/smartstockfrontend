// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [tab, setTab] = useState("inventory");
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [forecast, setForecast] = useState(null);
  const [insights, setInsights] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const API = "https://smartstock-o5e6.onrender.com/api";

  // ------------------ Fetch functions ------------------
  const fetchInventory = () => {
    fetch(`${API}/api/stock`)
      .then((res) => res.json())
      .then((data) => data.ok && setInventory(data.data));
  };

  const fetchAlerts = () => {
    fetch(`${API}/api/alerts`)
      .then((res) => res.json())
      .then((data) => data.ok && setAlerts(data.alerts));
  };

  const fetchProducts = () => {
    fetch(`${API}/api/products`)
      .then((res) => res.json())
      .then((data) => data.ok && setProducts(data.products));
  };

  const fetchForecast = (product) => {
    fetch(`${API}/api/forecast?product=${product}&horizon=7`)
      .then((res) => res.json())
      .then((data) => data.ok && setForecast(data));
  };

  const fetchInsights = () => {
    fetch(`${API}/api/insights`)
      .then((res) => res.json())
      .then((data) => data.ok && setInsights(data));
  };

  const handleSearch = () => {
    fetch(`${API}/api/stock`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          const found = data.data.find(
            (p) => p.product.toLowerCase() === searchTerm.toLowerCase()
          );
          setSearchResult(found || { error: "Product not found" });
        }
      });
  };

  // ------------------ Upload functions ------------------
  const uploadFile = (endpoint, file, callback) => {
    const formData = new FormData();
    formData.append("file", file);

    fetch(`${API}${endpoint}`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          alert(`${endpoint} upload successful ✅`);
          callback();
        } else {
          alert(`Upload failed: ${data.error}`);
        }
      })
      .catch(() => alert("Error uploading file"));
  };

  // ------------------ Effects ------------------
  useEffect(() => {
    if (tab === "inventory") fetchInventory();
    if (tab === "alerts") fetchAlerts();
    if (tab === "forecast") fetchProducts();
    if (tab === "insights") fetchInsights();
  }, [tab]);

  return (
    <div style={{ maxWidth: "1000px", margin: "30px auto", padding: "20px" }}>
    <div className="header">
      <h2>Dashboard</h2>
      <button
        className="logout-btn"
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </div>

      {/* Tabs */}
      <div className="tab-bar">
        {["inventory", "alerts", "forecast", "insights", "search"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? "active" : ""}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Inventory Tab */}
      {tab === "inventory" && (
        <div>
          <div className="card">
            <label className="upload-label">Upload Inventory CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) =>
                uploadFile(
                  "/api/upload/inventory",
                  e.target.files[0],
                  fetchInventory
                )
              }
            />
          </div>

          <div className="card">
            <label className="upload-label">Upload Sales CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) =>
                uploadFile("/api/upload/sales", e.target.files[0], fetchInventory)
              }
            />
          </div>

          <div className="card">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Batch ID</th>
                  <th>Stock Left</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, i) => (
                  <tr key={i}>
                    <td>{item.product}</td>
                    <td>{item.batch_id || "-"}</td>
                    <td>{item.stock_left}</td>
                    <td>{item.expiry_date || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {tab === "alerts" && (
        <div className="card">
          <h3>Alerts</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {alerts.map((a, i) => {
              let color = "black";
              if (a.type === "out_of_stock") color = "red";
              else if (a.type === "low_stock") color = "orange";
              else if (a.type === "expiry_soon") color = "darkgoldenrod";

              return (
                <li key={i} className="alert-item" style={{ color }}>
                  {a.type.toUpperCase()} → {a.product}{" "}
                  {a.batch_id ? `(Batch ${a.batch_id})` : ""}{" "}
                  {a.stock_left !== undefined && `(${a.stock_left} left)`}{" "}
                  {a.days_left !== undefined &&
                    `(expires in ${a.days_left} days)`}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Forecast Tab */}
      {tab === "forecast" && (
        <div className="card">
          <h3>Forecast</h3>
          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              fetchForecast(e.target.value);
            }}
          >
            <option value="">-- Select Product --</option>
            {products.map((p, i) => (
              <option key={i} value={p}>
                {p}
              </option>
            ))}
          </select>

          {forecast && (
            <div style={{ marginTop: "20px" }}>
              <h4>
                {forecast.product} (next {forecast.horizon_days} days)
              </h4>
              <ul>
                {forecast.forecast.map((f, i) => (
                  <li key={i}>
                    {f.date}: {f.pred.toFixed(1)} (range {f.lower.toFixed(1)} -{" "}
                    {f.upper.toFixed(1)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {tab === "insights" && insights && (
        <div className="card">
          <h3>Insights</h3>

          <h4>Daily</h4>
          <p>
            <b>Best Selling:</b>
          </p>
          <ul>
            {insights.daily.best.map((b, i) => (
              <li key={i}>
                {b.product}: {b.units}
              </li>
            ))}
          </ul>
          <p>
            <b>Least Selling:</b>
          </p>
          <ul>
            {insights.daily.least.map((l, i) => (
              <li key={i}>
                {l.product}: {l.units}
              </li>
            ))}
          </ul>

          <h4>Weekly</h4>
          <p>
            <b>Best Selling:</b>
          </p>
          <ul>
            {insights.weekly.best.map((b, i) => (
              <li key={i}>
                {b.product}: {b.units}
              </li>
            ))}
          </ul>
          <p>
            <b>Least Selling:</b>
          </p>
          <ul>
            {insights.weekly.least.map((l, i) => (
              <li key={i}>
                {l.product}: {l.units}
              </li>
            ))}
          </ul>

          <h4>Monthly</h4>
          <p>
            <b>Best Selling:</b>
          </p>
          <ul>
            {insights.monthly.best.map((b, i) => (
              <li key={i}>
                {b.product}: {b.units}
              </li>
            ))}
          </ul>
          <p>
            <b>Least Selling:</b>
          </p>
          <ul>
            {insights.monthly.least.map((l, i) => (
              <li key={i}>
                {l.product}: {l.units}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Tab */}
      {tab === "search" && (
        <div className="card">
          <h3>Search Product</h3>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter product name"
            className="input-box"
          />
          <button onClick={handleSearch} className="tab-btn">
            Search
          </button>

          {searchResult && (
            <div style={{ marginTop: "15px" }}>
              {searchResult.error ? (
                <p style={{ color: "red" }}>{searchResult.error}</p>
              ) : (
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Batch ID</th>
                      <th>Stock Left</th>
                      <th>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{searchResult.product}</td>
                      <td>{searchResult.batch_id || "-"}</td>
                      <td>{searchResult.stock_left}</td>
                      <td>{searchResult.expiry_date || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
