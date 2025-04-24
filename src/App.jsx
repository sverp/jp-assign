import Sidebar from "./components/Sidebar.jsx";
import MidArea from "./components/MidArea.jsx";
import PreviewArea from "./components/PreviewArea.jsx";

import { useState } from "react";

const App = () => {
  const [blocks, setBlocks] = useState([]);
  const [selectedSpriteId, setSelectedSpriteId] = useState(null);
  const [spriteMoveData, setSpriteMoveData] = useState([]);
  const [dirobj, setDirbj] = useState({ 0: 1, 1: 1, 2: 1 });

  return (
    <div className="flex flex-row ">
      <Sidebar />
      <MidArea
        dirobj={dirobj}
        setDirbj={setDirbj}
        selectedSpriteId={selectedSpriteId}
        setSpriteMoveData={setSpriteMoveData}
        blocks={blocks}
        setBlocks={setBlocks}
      />
      <PreviewArea
        spriteMoveData={spriteMoveData}
        dirobj={dirobj}
        selectedSpriteId={selectedSpriteId}
        setSelectedSpriteId={setSelectedSpriteId}
      />
    </div>
  );
};

export default App;
