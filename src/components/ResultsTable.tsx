import React from "react";
import type { RegencyResult } from "@/types/dryness";

interface ResultsTableProps {
  results: RegencyResult[];
  period: string;
  boundaryType?: "kabupaten" | "kecamatan";
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, period, boundaryType = "kabupaten" }) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Belum ada hasil. Unggah file CSV dan klik Hitung.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>PROV</th>
            <th>{boundaryType === "kecamatan" ? "KEC" : "KAB"}</th>
            <th className="text-right">n_total</th>
            <th className="text-right">pct_ch_rendah</th>
            <th className="text-center">ach_{period}_rendah</th>
            <th className="text-right">pct_ch_tinggi</th>
            <th className="text-center">ach_{period}_tinggi</th>
            <th className="text-right">pct_sh_bn</th>
            <th className="text-center">ash_{period}_BN</th>
            <th className="text-right">pct_sh_an</th>
            <th className="text-center">ash_{period}_AN</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row, idx) => (
            <tr key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <td>{idx + 1}</td>
              <td className="font-medium">{row.prov}</td>
              <td>{row.kab}</td>
              <td className="text-right tabular-nums">{row.n_total}</td>
              <td className="text-right tabular-nums">{row.pct_ch_rendah.toFixed(2)}%</td>
              <td className="text-center">
                <span
                  className={`indicator-badge ${
                    row.ach_rendah === 1 ? "indicator-badge--high" : "indicator-badge--low"
                  }`}
                >
                  {row.ach_rendah}
                </span>
              </td>
              <td className="text-right tabular-nums">{row.pct_ch_tinggi.toFixed(2)}%</td>
              <td className="text-center">
                <span
                  className={`indicator-badge ${
                    row.ach_tinggi === 1 ? "indicator-badge--high" : "indicator-badge--low"
                  }`}
                >
                  {row.ach_tinggi}
                </span>
              </td>
              <td className="text-right tabular-nums">{row.pct_sh_bn.toFixed(2)}%</td>
              <td className="text-center">
                <span
                  className={`indicator-badge ${
                    row.ash_bn === 1 ? "indicator-badge--high" : "indicator-badge--low"
                  }`}
                >
                  {row.ash_bn}
                </span>
              </td>
              <td className="text-right tabular-nums">{row.pct_sh_an.toFixed(2)}%</td>
              <td className="text-center">
                <span
                  className={`indicator-badge ${
                    row.ash_an === 1 ? "indicator-badge--high" : "indicator-badge--low"
                  }`}
                >
                  {row.ash_an}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
