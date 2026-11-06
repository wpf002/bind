import Link from "next/link";
import { listInstruments } from "@bind/db";
import { Jur, Tip } from "@/components/marks";

export const metadata = { title: "Instruments" };

export default async function Instruments() {
  const jurisdictions = await listInstruments();
  const instruments = jurisdictions.flatMap((j) => j.instruments);
  const provisions = instruments.reduce((n, i) => n + i.provisions, 0);
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">
          Instruments
          <Tip text="Every statute, regulation, ruling or standard a published case rests on, with the provisions the corpus cites." />
        </h1>
        <div className="page-stats">
          <div className="page-stat">
            <b>{instruments.length}</b>
            <span>Instruments</span>
          </div>
          <div className="page-stat">
            <b>{provisions}</b>
            <span>Provisions</span>
          </div>
          <div className="page-stat">
            <b>{jurisdictions.length}</b>
            <span>Jurisdictions</span>
          </div>
        </div>
      </header>
      {jurisdictions.map((j) => (
        <section key={j.code} id={j.code} style={{ marginBottom: 48 }}>
          <div className="sect-h">
            <Jur code={j.code} />
            <h2>{j.name}</h2>
            <span className="n">{j.instruments.length}</span>
          </div>
          <table className="log">
            <thead>
              <tr>
                <th>Instrument</th>
                <th className="col-regime">Regime</th>
                <th className="col-n">Provisions</th>
                <th className="col-n">Cases</th>
              </tr>
            </thead>
            <tbody>
              {j.instruments.map((i) => (
                <tr key={i.slug}>
                  <td className="c-case">
                    <Link className="row-link" href={`/instruments/${i.slug}`} aria-label={i.shortName} />
                    <div className="row-title">{i.shortName}</div>
                    <div className="row-statement">{i.instruments.join(" · ")}</div>
                  </td>
                  <td className="c-regime">{i.regimes.join(" · ")}</td>
                  <td className="mono c-n" data-label="Provisions">
                    {i.provisions}
                  </td>
                  <td className="mono c-n" data-label="Cases">
                    {i.cases}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
