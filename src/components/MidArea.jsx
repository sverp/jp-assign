import React, { useEffect, useMemo, useState } from "react";

const MidArea = ({
  blocks,
  setBlocks,
  selectedSpriteId,
  setSelectedSpriteId,
  spriteMoveData,
  setSpriteMoveData,
  setDirbj,
  dirobj,
}) => {
  const [idBlockData, setIdBlockData] = useState({});
  let [maxi, setMaxi] = useState(0);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData("text/plain");
    if (selectedSpriteId !== undefined) {
      setIdBlockData((prev) => ({
        ...prev,
        [selectedSpriteId]: [...(prev[selectedSpriteId] || []), blockType],
      }));
    }

    for (const [key, value] of Object.entries(idBlockData)) {
      setMaxi(Math.max(maxi, value.length));
    }
  };

  const movearr = useMemo(() => {
    let temp = [];
    for (let i = 0; i < maxi; i++) {
      for (const [key, value] of Object.entries(idBlockData)) {
        if (value[i] != undefined) {
          let sp = value[i].split("_");
          const type = sp[0];
          const val = parseFloat(sp[1]);
          let nkey = parseInt(key);
          if (type === "LEFT") {
            temp.push({
              id: nkey,
              vx: -val,
              vy: 0,
              vr: 0,
              action: null,
              message: null,
              time: null,
            });
          } else if (type === "RIGHT") {
            temp.push({
              id: nkey,
              vx: val,
              vy: 0,
              vr: 0,
              action: null,
              message: null,
              time: null,
            });
          } else if (type === "ROT") {
            temp.push({
              id: nkey,
              vx: 0,
              vy: 0,
              vr: val,
              action: null,
              message: null,
              time: null,
            });
          } else if (type === "XY") {
            temp.push({
              id: nkey,
              vx: parseFloat(sp[1]),
              vy: parseFloat(sp[2]),
              vr: val,
              action: null,
              message: null,
              time: null,
            });
          } else if (type === "ROTLEFT") {
            temp.push({
              id: nkey,
              vx: 0,
              vy: 0,
              vr: -val,
              action: null,
              message: null,
              time: null,
            });
          } else if (type === "THINK" || type === "SAY") {
            temp.push({
              id: nkey,
              vx: 0,
              vy: 0,
              vr: 0,
              action: type,
              message: sp.slice(1).join("_"),
              time: sp[2],
            });
          }
        }
      }
    }
    console.log("ttttttt", temp);
    return temp;
  }, [idBlockData, maxi]);

  useEffect(() => {
    setSpriteMoveData(movearr);
  }, [movearr, setSpriteMoveData]);

  return (
    <div
      className="flex-1 min-h-[500px] border-4 border-dashed border-black-500 rounded-lg overflow-auto p-4 bg-amber-50"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <p className="font-bold mt-4">Actions</p>
      <div className="flex flex-col gap-2">
        {Array.isArray(idBlockData[selectedSpriteId]) ? (
          idBlockData[selectedSpriteId].map((block, index) => (
            <div
              key={index}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-sm"
            >
              {(() => {
                const [type, ...rest] = block.split("_");
                switch (type) {
                  case "LEFT":
                    return `Move left by ${rest[0]} steps`;
                  case "RIGHT":
                    return `Move right by ${rest[0]} steps`;
                  case "ROT":
                    return `Rotate by ${rest[0]} degrees`;
                  case "ROTLEFT":
                    return `Rotate left by ${rest[0]} degrees`;
                  case "XY":
                    return `Move by X: ${rest[0]} steps, Y: ${rest[1]} steps`;
                  case "THINK":
                    return `Think: "${rest
                      .slice(0, -1)
                      .join(" ")}" for ${rest.at(-1)}s`;
                  case "SAY":
                    return `Say: "${rest.slice(0, -1).join(" ")}" for ${rest.at(
                      -1
                    )}s`;
                  default:
                    return block;
                }
              })()}
            </div>
          ))
        ) : selectedSpriteId != null ? (
          <div className="text-gray-600">
            Selected sprite ID: {selectedSpriteId}
          </div>
        ) : (
          <p className="text-gray-500 italic">Click on a sprite to start</p>
        )}
      </div>
    </div>
  );
};

export default MidArea;
