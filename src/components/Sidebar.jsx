import React, { useState } from "react";
import Icon from "./Icon";

export default function Sidebar() {
  const [duration, setDuration] = useState(1);
  const [thinkText, setThinkText] = useState("I'm thinking...");
  const [sayText, setSayText] = useState("Hello world!");
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [rotate, setRotate] = useState(0);
  const handleDragStart = (e, blockType) => {
    e.dataTransfer.setData("text/plain", blockType);
  };

  return (
    <div className="w-58 flex-none h-full overflow-y-auto flex flex-col items-start p-2 border-r border-gray-200">
      <div className="font-bold mt-4">{"Motion"}</div>
      <div
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-move rounded-sm"
        draggable="true"
        onDragStart={(e) => handleDragStart(e, `X_${coords["x"]}`)}
      >
        {"Move X by"}
        <input
          type="text"
          value={coords.x}
          onChange={(e) =>
            setCoords((prev) => ({ ...prev, x: e.target.value }))
          }
          className="ml-2 w-16 bg-purple-300 text-black px-1 rounded-sm"
        />
        {"steps"}
      </div>
      <div
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-move rounded-sm"
        draggable="true"
        onDragStart={(e) => handleDragStart(e, `Y_${coords["y"]}`)}
      >
        {"Move Y by"}
        <input
          type="text"
          value={coords.y}
          onChange={(e) =>
            setCoords((prev) => ({ ...prev, y: e.target.value }))
          }
          className="ml-2 w-16 bg-purple-300 text-black px-1 rounded-sm"
        />
        {"steps"}
      </div>
      <div
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-move rounded-sm"
        draggable="true"
        onDragStart={(e) =>
          handleDragStart(e, `XY_${coords["x"]}_${coords["y"]}`)
        }
      >
        Move steps by
        <div className="flex flex-row">
          X:
          <input
            type="text"
            value={coords.x}
            onChange={(e) =>
              setCoords((prev) => ({ ...prev, x: e.target.value }))
            }
            className="ml-2 w-16 bg-purple-300 text-black px-1 rounded-sm"
          />
          Y:
          <input
            type="text"
            value={coords.y}
            onChange={(e) =>
              setCoords((prev) => ({ ...prev, y: e.target.value }))
            }
            className="ml-2 w-16 bg-purple-300 text-black px-1 rounded-sm"
          />
        </div>
      </div>
      <div
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-move rounded-sm"
        draggable="true"
        onDragStart={(e) => handleDragStart(e, "ROT_15")}
      >
        {"Turn "}
        <Icon name="undo" size={15} className="text-white mx-2" />
        {"15 degrees right"}
      </div>
      <div
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-move rounded-sm"
        draggable="true"
        onDragStart={(e) => handleDragStart(e, "ROTLEFT_15")}
      >
        {"Turn "}
        <Icon name="redo" size={15} className="text-white mx-2" />
        {"15 degrees left"}
      </div>
      <div
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-move rounded-sm"
        draggable="true"
        onDragStart={(e) => handleDragStart(e, `ROT_${rotate}`)}
      >
        Rotate by
        <div className="flex flex-row">
          <input
            type="text"
            value={rotate}
            onChange={(e) => setRotate(e.target.value)}
            className="ml-2 w-16 bg-purple-300 text-black px-1 rounded-sm"
          />
        </div>
      </div>
      <div
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-move rounded-sm"
        draggable="true"
        onDragStart={(e) => handleDragStart(e, "REP")}
      >
        {"Repeat"}
      </div>

      <div className="font-bold mt-4">{"Looks"}</div>

      <div className="flex flex-col items-center bg-purple-500 text-white px-2 py-1 my-2 text-sm rounded-sm w-full">
        <div
          className="cursor-move"
          draggable="true"
          onDragStart={(e) => handleDragStart(e, `SAY_${sayText}_${duration}`)}
        >
          Say
        </div>
        <input
          type="text"
          value={sayText}
          onChange={(e) => setSayText(e.target.value)}
          className="ml-2 flex-1 bg-purple-300 text-black px-1 rounded-sm"
        />
        <p> for </p>
        <input
          type="text"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="ml-2 flex-1 bg-purple-300 text-black px-1 rounded-sm"
        />
      </div>

      <div className="flex flex-col items-center bg-purple-500 text-white px-2 py-1 my-2 text-sm rounded-sm w-full">
        <div
          className="cursor-move"
          draggable="true"
          onDragStart={(e) =>
            handleDragStart(e, `THINK_${thinkText}_${duration}`)
          }
        >
          Think
        </div>
        <input
          type="text"
          value={thinkText}
          onChange={(e) => setThinkText(e.target.value)}
          className="ml-2 flex-1 bg-purple-300 text-black px-1 rounded-sm"
        />
        <p> for </p>
        <input
          type="text"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="ml-2 flex-1 bg-purple-300 text-black px-1 rounded-sm"
        />
      </div>
    </div>
  );
}
