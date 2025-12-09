// src/pages/BarangKeluarPage.jsx
import { useEffect, useState } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function BarangKeluarPage() {
  const { user } = useAuth();

  const [barangList, setBarangList] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    barangId: "",
    jumlah: 1,
    jenis: "dipinjam", // dipinjam / dipindah / rusak / lainnya
    keterangan: "",
  });

  const [selectedBarang, setSelectedBarang] = useState(null);

  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [lowStockWarning, setLowStockWarning] = useState("");

  /* ===================== LOAD DATA ===================== */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        setError("");

        // NOTE: sesuaikan endpoint dengan backend kamu
        const [barangRes, transaksiRes] = await Promise.all([
          api.get("/barang"),
          api.get("/barang-keluar"),
        ]);

        setBarangList(barangRes.data || []);
        setTransaksiList(transaksiRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data barang keluar.");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  /* ===================== HANDLER FORM ===================== */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "jumlah" ? Number(value) : value,
    }));

    if (name === "barangId") {
      const found = barangList.find(
        (b) =>
          String(b.id) === value ||
          String(b.id_barang) === value || // jaga-jaga nama field berbeda
          String(b.kode) === value
      );
      setSelectedBarang(found || null);
      setLowStockWarning("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.barangId) {
      alert("Silakan pilih barang / peralatan terlebih dahulu.");
      return;
    }
    if (!form.jumlah || form.jumlah <= 0) {
      alert("Jumlah keluar harus lebih dari 0.");
      return;
    }

    try {
      setLoadingSave(true);
      setError("");
      setLowStockWarning("");

      const payload = {
        tanggal: form.tanggal,
        barang_id: form.barangId,
        jumlah: form.jumlah,
        jenis: form.jenis,
        keterangan: form.keterangan,
      };

      // NOTE: sesuaikan endpoint + body dengan backend kamu
      const res = await api.post("/barang-keluar", payload);

      // Misal backend mengembalikan transaksi baru & data barang yang sudah di-update
      const created = res.data?.transaksi || res.data;
      if (created) {
        setTransaksiList((prev) => [created, ...prev]);
      }

      const updatedBarang =
        res.data?.barang ||
        res.data?.item ||
        res.data?.updatedBarang ||
        null;

      // Kalau backend kirim stok terbaru, kita cek stok minimum untuk warning
      if (updatedBarang) {
        const stokSekarang =
          updatedBarang.stok ?? updatedBarang.stock ?? updatedBarang.stok_akhir;
        const stokMin =
          updatedBarang.stok_min ??
          updatedBarang.min_stock ??
          updatedBarang.stokMinimum ??
          0;

        if (stokSekarang !== undefined && stokSekarang <= stokMin) {
          setLowStockWarning(
            `Stok "${updatedBarang.nama || updatedBarang.nama_barang || "-"}" sudah berada di batas minimum (${stokSekarang} ${updatedBarang.satuan || ""}).`
          );
        }

        // sinkronkan list barang di dropdown
        setBarangList((prev) =>
          prev.map((b) =>
            b.id === updatedBarang.id || b.id_barang === updatedBarang.id
              ? { ...b, ...updatedBarang }
              : b
          )
        );
        setSelectedBarang(updatedBarang);
      }

      // reset jumlah & keterangan
      setForm((prev) => ({
        ...prev,
        jumlah: 1,
        keterangan: "",
      }));
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan transaksi barang keluar.");
    } finally {
      setLoadingSave(false);
    }
  };

  /* ===================== RENDER ===================== */

  return (
    <div className="page">
      {/* Judul halaman */}
      <div className="page-section-header">
        <h1 className="page-section-title">Barang / Peralatan Keluar</h1>
        <p className="page-section-subtitle">
          Catat barang yang keluar untuk dipinjam karyawan, dipindahkan, atau
          karena rusak. Stok akan berkurang secara otomatis.
        </p>
      </div>

      <div className="page-grid-2">
        {/* ---------- FORM INPUT ---------- */}
        <div className="form-card">
          <div className="form-card-header">
            <h2 className="form-card-title">Input Barang Keluar</h2>
            <p className="form-card-subtitle">
              Isi data barang keluar dengan lengkap agar riwayat inventori
              rapi.
            </p>
          </div>

          {error && (
            <div className="login-error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-grid">
            {/* Tanggal */}
            <div className="form-group">
              <label>Tanggal Keluar</label>
              <input
                type="date"
                name="tanggal"
                value={form.tanggal}
                onChange={handleChange}
                required
              />
            </div>

            {/* Barang */}
            <div className="form-group">
              <label>Barang / Peralatan</label>
              <select
                name="barangId"
                value={form.barangId}
                onChange={handleChange}
                required
              >
                <option value="">-- Pilih Barang --</option>
                {barangList.map((b) => (
                  <option
                    key={b.id || b.id_barang}
                    value={b.id || b.id_barang}
                  >
                    {b.nama || b.nama_barang}{" "}
                    {b.kode ? `(${b.kode})` : b.kode_barang ? `(${b.kode_barang})` : ""}
                  </option>
                ))}
              </select>
              {selectedBarang && (
                <small style={{ fontSize: 11, color: "#6b7280" }}>
                  Stok saat ini:{" "}
                  <strong>
                    {selectedBarang.stok ??
                      selectedBarang.stock ??
                      selectedBarang.stok_akhir ??
                      0}{" "}
                    {selectedBarang.satuan || ""}
                  </strong>{" "}
                  {selectedBarang.stok_min !== undefined && (
                    <>
                      | Stok minimum:{" "}
                      <strong>{selectedBarang.stok_min}</strong>
                    </>
                  )}
                </small>
              )}
            </div>

            {/* Jumlah */}
            <div className="form-group">
              <label>Jumlah Keluar</label>
              <input
                type="number"
                name="jumlah"
                min={1}
                value={form.jumlah}
                onChange={handleChange}
                required
              />
            </div>

            {/* Jenis / keterangan singkat */}
            <div className="form-group">
              <label>Keterangan (Dipinjam / Dipindah / Rusak)</label>
              <div className="form-group-inline">
                <select
                  name="jenis"
                  value={form.jenis}
                  onChange={handleChange}
                >
                  <option value="dipinjam">Dipinjam</option>
                  <option value="dipindah">Dipindah</option>
                  <option value="rusak">Rusak</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                <input
                  type="text"
                  name="keterangan"
                  value={form.keterangan}
                  onChange={handleChange}
                  placeholder="Contoh: Dipinjam Bagian IT / Pindah ke ruang rapat"
                />
              </div>
              <small style={{ fontSize: 11, color: "#6b7280" }}>
                Isi keterangan tambahan seperti nama peminjam, tujuan, atau
                lokasi.
              </small>
            </div>

            {lowStockWarning && (
              <div
                style={{
                  backgroundColor: "#fef3c7",
                  border: "1px solid #facc15",
                  color: "#92400e",
                  borderRadius: 6,
                  padding: "6px 8px",
                  fontSize: 12,
                }}
              >
                {lowStockWarning}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loadingSave}
              >
                {loadingSave ? "Menyimpan..." : "Simpan Transaksi"}
              </button>
            </div>
          </form>
        </div>

        {/* ---------- RIWAYAT TRANSAKSI ---------- */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <div className="table-card-title">Riwayat Barang Keluar</div>
              <div className="table-card-title-count">
                Total: {transaksiList.length} transaksi
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>Tanggal</th>
                  <th>Nama Barang</th>
                  <th style={{ width: "70px" }}>Jumlah</th>
                  <th style={{ width: "90px" }}>Jenis</th>
                  <th>Keterangan</th>
                  <th style={{ width: "90px" }}>Petugas</th>
                </tr>
              </thead>
              <tbody>
                {loadingData ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      Memuat data…
                    </td>
                  </tr>
                ) : transaksiList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      Belum ada transaksi barang keluar yang tercatat.
                    </td>
                  </tr>
                ) : (
                  transaksiList.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.tanggal || tx.tanggal_keluar}</td>
                      <td>
                        {tx.barang?.nama ||
                          tx.nama_barang ||
                          tx.barang_nama ||
                          "-"}
                      </td>
                      <td>{tx.jumlah}</td>
                      <td
                        style={{
                          textTransform: "capitalize",
                          fontSize: 12,
                        }}
                      >
                        {tx.jenis || tx.status || "-"}
                      </td>
                      <td>{tx.keterangan || "-"}</td>
                      <td>
                        {tx.user?.name ||
                          tx.petugas ||
                          tx.dibuat_oleh ||
                          user?.name ||
                          "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            Riwayat transaksi semua peralatan yang keluar dari gudang.
          </div>
        </div>
      </div>
    </div>
  );
}
