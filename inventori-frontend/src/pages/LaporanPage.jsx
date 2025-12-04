// src/pages/LaporanPage.jsx
import { useEffect, useState } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LaporanPage() {
  const { user } = useAuth();

  // range tanggal
  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = today.slice(0, 8) + "01";

  const [fromDate, setFromDate] = useState(startOfMonth);
  const [toDate, setToDate] = useState(today);

  // data laporan
  const [stokAkhir, setStokAkhir] = useState([]);
  const [barangMasuk, setBarangMasuk] = useState([]);
  const [barangKeluar, setBarangKeluar] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filter view: all | masuk | keluar
  const [viewMode, setViewMode] = useState("all");

  // --- helper untuk load laporan dari API ---
  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      // ❗❗ SESUAIKAN endpoint berikut dengan backend-mu
      const [stokRes, masukRes, keluarRes] = await Promise.all([
        api.get("/laporan/stok-akhir", {
          params: { from: fromDate, to: toDate },
        }),
        api.get("/laporan/barang-masuk", {
          params: { from: fromDate, to: toDate },
        }),
        api.get("/laporan/barang-keluar", {
          params: { from: fromDate, to: toDate },
        }),
      ]);

      setStokAkhir(stokRes.data || []);
      setBarangMasuk(masukRes.data || []);
      setBarangKeluar(keluarRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat laporan inventori.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadReport();
  };

  // ---------------- EXPORT CSV ----------------
  const exportCsv = () => {
    // helper escape untuk koma & kutip
    const esc = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = [];

    // header
    rows.push([
      "Jenis Laporan",
      "Tanggal",
      "Kode",
      "Nama Barang",
      "Jumlah",
      "Stok Akhir",
      "Satuan",
      "Supplier / Penerima",
      "Jenis",
      "Keterangan",
    ]);

    // Stok akhir
    stokAkhir.forEach((item) => {
      // ❗ sesuaikan field: kode, nama, stok, satuan
      rows.push([
        "Stok Akhir",
        "",
        esc(item.kode || item.kode_barang),
        esc(item.nama || item.nama_barang),
        "",
        esc(item.stok),
        esc(item.satuan),
        "",
        "",
        "",
      ]);
    });

    // Barang masuk
    barangMasuk.forEach((t) => {
      rows.push([
        "Barang Masuk",
        esc(t.tanggal),
        esc(t.kode_barang),
        esc(t.nama_barang),
        esc(t.jumlah),
        "",
        esc(t.satuan),
        esc(t.supplier),
        "",
        esc(t.keterangan),
      ]);
    });

    // Barang keluar
    barangKeluar.forEach((t) => {
      rows.push([
        "Barang Keluar",
        esc(t.tanggal),
        esc(t.kode_barang),
        esc(t.nama_barang),
        esc(t.jumlah),
        "",
        esc(t.satuan),
        esc(t.penerima),
        esc(t.jenis_keluar),
        esc(t.keterangan),
      ]);
    });

    const csvContent =
      "\uFEFF" + rows.map((r) => r.join(",")).join("\n"); // \uFEFF biar Excel baca UTF-8
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-inventori_${fromDate}_sd_${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---------------- EXPORT PDF (via print dialog) ----------------
  const exportPdf = () => {
    const printArea = document.getElementById("laporan-print-area");
    if (!printArea) return;

    const win = window.open("", "_blank", "width=900,height=650");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Laporan Inventori</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              padding: 16px;
              color: #111827;
            }
            h1, h2, h3 {
              margin: 0 0 8px 0;
            }
            .subtitle {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-bottom: 16px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 4px 6px;
              text-align: left;
            }
            th {
              background: #f3f4f6;
            }
          </style>
        </head>
        <body>
          ${printArea.innerHTML}
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  };

  const totalStok = stokAkhir.reduce(
    (sum, item) => sum + (Number(item.stok) || 0),
    0
  );

  return (
    <div className="page">
      {/* HEADER HALAMAN */}
      <div className="page-section-header">
        <h1 className="page-section-title">Laporan Inventori</h1>
        <p className="page-section-subtitle">
          Lihat ringkasan stok akhir dan riwayat barang masuk / keluar
          berdasarkan periode yang dipilih.
        </p>
      </div>

      {/* KARTU UTAMA LAPORAN */}
      <div className="table-card report-card">
        {/* FILTER & ACTIONS */}
        <div className="report-card-header">
          <div>
            <h2 className="report-card-title">
              Ringkasan Inventori Peralatan Kantor
            </h2>
            <p className="report-card-subtitle">
              Periode{" "}
              <strong>
                {fromDate} s/d {toDate}
              </strong>{" "}
              • Dicetak oleh <strong>{user?.name || "Admin"}</strong>
            </p>
          </div>

          <form
            className="report-filter-bar"
            onSubmit={handleFilterSubmit}
          >
            <div className="report-filter-group">
              <label>Dari Tanggal</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="report-filter-group">
              <label>Sampai Tanggal</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="report-filter-actions">
              <button
                type="submit"
                className="btn-primary btn-sm"
                disabled={loading}
              >
                {loading ? "Memuat..." : "Tampilkan"}
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={exportCsv}
                disabled={loading}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={exportPdf}
                disabled={loading}
              >
                Export PDF
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* SWITCH TAMPILAN PERIODE */}
        <div className="report-view-switch">
          <span className="report-view-label">Tampilkan:</span>
          <button
            type="button"
            className={
              viewMode === "all"
                ? "btn-secondary btn-sm view-pill active"
                : "btn-secondary btn-sm view-pill"
            }
            onClick={() => setViewMode("all")}
          >
            Semua
          </button>
          <button
            type="button"
            className={
              viewMode === "masuk"
                ? "btn-secondary btn-sm view-pill active"
                : "btn-secondary btn-sm view-pill"
            }
            onClick={() => setViewMode("masuk")}
          >
            Barang Masuk
          </button>
          <button
            type="button"
            className={
              viewMode === "keluar"
                ? "btn-secondary btn-sm view-pill active"
                : "btn-secondary btn-sm view-pill"
            }
            onClick={() => setViewMode("keluar")}
          >
            Barang Keluar
          </button>
        </div>

        {/* AREA YANG DI-PRINT / DIEKSPORT PDF */}
        <div id="laporan-print-area">
          {/* --- 1. LAPORAN STOK AKHIR --- */}
          <div style={{ marginBottom: 18 }}>
            <div className="table-card-header" style={{ padding: 0 }}>
              <div className="table-card-title">
                Laporan Stok Akhir
                <span className="table-card-title-count">
                  {" "}
                  • Total item: {stokAkhir.length} • Total stok: {totalStok}
                </span>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No.</th>
                    <th>Nama Barang</th>
                    <th>Kode</th>
                    <th style={{ width: 80 }}>Stok</th>
                    <th style={{ width: 90 }}>Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {stokAkhir.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center" }}>
                        Belum ada data stok. Data akan muncul setelah
                        Anda menambahkan barang dan melakukan transaksi.
                      </td>
                    </tr>
                  ) : (
                    stokAkhir.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>{idx + 1}</td>
                        <td>{item.nama || item.nama_barang}</td>
                        <td>{item.kode || item.kode_barang}</td>
                        <td>
                          <span className="badge-stock">
                            {item.stok}
                          </span>
                        </td>
                        <td>{item.satuan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- 2. LAPORAN BARANG MASUK PER PERIODE --- */}
          {(viewMode === "all" || viewMode === "masuk") && (
            <div style={{ marginBottom: 18 }}>
              <div className="table-card-header" style={{ padding: 0 }}>
                <div className="table-card-title">
                  Laporan Barang Masuk per Periode
                  <span className="table-card-title-count">
                    {" "}
                    • {barangMasuk.length} transaksi
                  </span>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>No.</th>
                      <th style={{ width: 110 }}>Tanggal</th>
                      <th>Nama Barang</th>
                      <th style={{ width: 90 }}>Kode</th>
                      <th style={{ width: 70 }}>Jumlah</th>
                      <th style={{ width: 90 }}>Satuan</th>
                      <th>Supplier</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barangMasuk.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center" }}>
                          Belum ada transaksi barang masuk pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      barangMasuk.map((t, idx) => (
                        <tr key={t.id || idx}>
                          <td>{idx + 1}</td>
                          <td>{t.tanggal}</td>
                          <td>{t.nama_barang}</td>
                          <td>{t.kode_barang}</td>
                          <td>{t.jumlah}</td>
                          <td>{t.satuan}</td>
                          <td>{t.supplier}</td>
                          <td>{t.keterangan}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- 3. LAPORAN BARANG KELUAR PER PERIODE --- */}
          {(viewMode === "all" || viewMode === "keluar") && (
            <div>
              <div className="table-card-header" style={{ padding: 0 }}>
                <div className="table-card-title">
                  Laporan Barang / Peralatan Keluar per Periode
                  <span className="table-card-title-count">
                    {" "}
                    • {barangKeluar.length} transaksi
                  </span>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>No.</th>
                      <th style={{ width: 110 }}>Tanggal</th>
                      <th>Nama Barang</th>
                      <th style={{ width: 90 }}>Kode</th>
                      <th style={{ width: 70 }}>Jumlah</th>
                      <th style={{ width: 90 }}>Satuan</th>
                      <th style={{ width: 120 }}>Jenis</th>
                      <th style={{ width: 160 }}>Penerima / Tujuan</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barangKeluar.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center" }}>
                          Belum ada transaksi barang keluar pada periode
                          ini.
                        </td>
                      </tr>
                    ) : (
                      barangKeluar.map((t, idx) => (
                        <tr key={t.id || idx}>
                          <td>{idx + 1}</td>
                          <td>{t.tanggal}</td>
                          <td>{t.nama_barang}</td>
                          <td>{t.kode_barang}</td>
                          <td>{t.jumlah}</td>
                          <td>{t.satuan}</td>
                          <td>{t.jenis_keluar}</td>
                          <td>{t.penerima}</td>
                          <td>{t.keterangan}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="table-footer" style={{ marginTop: 12 }}>
          Riwayat transaksi semua peralatan kantor ditampilkan berdasarkan
          periode yang dipilih. Gunakan tombol <strong>Export CSV</strong>{" "}
          atau <strong>Export PDF</strong> untuk mengunduh laporan.
        </div>
      </div>
    </div>
  );
}
