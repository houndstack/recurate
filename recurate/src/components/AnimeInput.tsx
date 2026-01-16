import { useState } from "react";
import React from "react"

interface Props {
  onSubmit: (titles: string[]) => void;
}

export default function AnimeInput({ onSubmit }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const titles = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (titles.length > 0) {
      onSubmit(titles);
    }
  };

  return (
    <div className="input-group">
      <input
        type="text"
        placeholder="e.g. Steins;Gate, Monster, Death Note"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={handleSubmit}>Recommend</button>
    </div>
  );
}
