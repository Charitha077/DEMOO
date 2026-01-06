import { useEffect, useState } from "react";

export default function Captcha({ onValidate }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [value, setValue] = useState("");

  useEffect(() => {
    generate();
  }, []);

  const generate = () => {
    const x = Math.floor(Math.random() * 10);
    const y = Math.floor(Math.random() * 10);
    setA(x);
    setB(y);
    setValue("");
    onValidate(false);
  };

  const check = (v) => {
    setValue(v);
    onValidate(Number(v) === a + b);
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        CAPTCHA
      </label>

      <div className="flex items-center gap-3">
        <span className="px-4 py-2 bg-gray-100 rounded text-sm font-semibold">
          {a} + {b} =
        </span>

      <input
        type="number"
        value={value}
        onChange={(e) => check(e.target.value)}
        className="flex-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="?"
/>


        <button
          type="button"
          onClick={generate}
          className="px-3 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
