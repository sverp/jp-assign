import Sidebar from "./components/Sidebar.jsx";
import MidArea from "./components/MidArea.jsx";
import PreviewArea from "./components/PreviewArea.jsx";

import { useState } from "react";

const App = () => {
  const [selectedSpriteId, setSelectedSpriteId] = useState(null);
  const [spriteMoveData, setSpriteMoveData] = useState([]);
  const [dirobj, setDirObj] = useState({});

  return (
    <div className="flex flex-row ">
      <Sidebar />
      <MidArea
        dirobj={dirobj}
        setDirObj={setDirObj}
        selectedSpriteId={selectedSpriteId}
        setSpriteMoveData={setSpriteMoveData}
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
