"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type AnyJson = Record<string, unknown>;

export const dynamic = "force-dynamic";

export default function DebugPage() {
  const [data, setData] = useState<AnyJson>({ loading: true });
  const [loading, setLoading] = useState(false);

  async function load(path: string) {
    setLoading(true);

    try {
      const res = await fetch(path, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (error) {
      setData({
        ok: false,
        version: "DEBUG CENTER V2.14",
        error: String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("/api/debug?smoke=1");
  }, []);

  const pretty = useMemo(() => JSON.stringify(data, null, 2), [data]);

  async function copy() {
    await navigator.clipboard.writeText(pretty);
    alert("JSON скопирован");
  }

  return (
    <main style={main}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 34 }}>
          Import Auto Debug Center V2.14
        </h1>

        <p style={{ color: "#8ea4c8", marginTop: 8 }}>
          Все проверки выводятся здесь. Консоль сервера используем только для установки кода.
        </p>

        <div style={buttons}>
          <button style={btn} onClick={() => load("/api/debug")}>Debug</button>
          <button style={btn} onClick={() => load("/api/debug?smoke=1")}>Smoke</button>
          <button style={btn} onClick={() => load("/summary.json")}>Summary</button>
          <button style={btn} onClick={() => load("/api/debug/run?test=all")}>Run All</button>
          <button style={btn} onClick={() => load("/api/debug/run?test=catalog-flow")}>Catalog Flow</button>
          <button style={btn} onClick={() => load("/api/debug/run?test=dictionaries")}>Dictionaries</button>
          <button style={btn} onClick={() => load("/api/debug/run?test=filters")}>Filters</button>
          <button style={btn} onClick={() => load("/api/debug/run?test=catalog-debug")}>Catalog Debug</button>
          <button style={btn} onClick={() => load("/api/debug/run?test=images")}>Images</button>
          <button style={btn} onClick={() => load("/api/debug/run?test=catalog")}>Catalog</button>
          <button style={btn} onClick={() => load("/api/debug/run?test=brands")}>Brands</button>
          <button style={btn} onClick={() => load("/api/debug/image-quality")}>Image Quality</button>
          <button style={btn} onClick={() => load("/api/debug/detail")}>Detail Scan</button>
          <button style={btn} onClick={() => load("/api/debug/detail-lot?id=hDQ3x6CgmVwXC1")}>Detail Lot</button>
          <button style={btn} onClick={() => load("/api/debug/ui")}>UI Scan</button>
          <button style={btn} onClick={() => load("/api/debug/catalog-safe")}>Catalog Safe</button>
          <button style={btn} onClick={() => load("/api/debug/catalog-audit")}>Catalog Audit</button>
          <button style={btn} onClick={copy}>Copy JSON</button>
        </div>

        {loading && <div style={box}>Загрузка проверки...</div>}

        <pre style={pre}>{pretty}</pre>
      </div>
    </main>
  );
}

const main: CSSProperties = {
  minHeight: "100vh",
  background: "#07111f",
  color: "#e5eefc",
  padding: 24,
  fontFamily: "Arial, sans-serif",
};

const buttons: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  margin: "20px 0",
};

const btn: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #3b82f6",
  background: "#1d4ed8",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const box: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: "#10213d",
  border: "1px solid #26466f",
  marginBottom: 16,
};

const pre: CSSProperties = {
  background: "#020817",
  border: "1px solid #1d355c",
  borderRadius: 16,
  padding: 18,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
  fontSize: 13,
  lineHeight: 1.45,
};
