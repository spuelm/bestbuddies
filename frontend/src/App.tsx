import { useState } from "react";

function App() {
  const [name, setName] = useState("");

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "50px auto",
        fontFamily: "Arial",
      }}
    >
      <h1>BestBuddies</h1>

      <p>Finde historische Zeitgenossen berühmter Persönlichkeiten.</p>

      <input
        type="text"
        placeholder="z.B. Johann Wolfgang von Goethe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
        }}
      />

      <button
        style={{
          marginTop: "10px",
          padding: "10px 20px",
        }}
      >
        Suchen
      </button>

      <div style={{ marginTop: "30px" }}>
        Aktuelle Suche: <b>{name}</b>
      </div>
    </div>
  );
}

export default App;