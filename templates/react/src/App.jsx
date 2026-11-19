import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1>React Demo</h1>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        count is {count}
      </button>
    </main>
  );
}
