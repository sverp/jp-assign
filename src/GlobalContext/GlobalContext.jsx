import React, { createContext, useContext, useState, useRef } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [selectedSpriteId, setSelectedSpriteId] = useState(null);
  const [spriteMoveData, setSpriteMoveData] = useState([]);
  const [dirobj, setDirObj] = useState({});
  const [idBlockData, setIdBlockData] = useState({});
  const nextSpriteIdRef = useRef(0);

  const resetAll = () => {
    setSelectedSpriteId(null);
    setSpriteMoveData([]);
    setDirObj({});
    setIdBlockData({});
    nextSpriteIdRef.current = 0;
  };

  return (
    <GlobalContext.Provider
      value={{
        selectedSpriteId,
        setSelectedSpriteId,
        spriteMoveData,
        setSpriteMoveData,
        dirobj,
        setDirObj,
        idBlockData,
        setIdBlockData,
        resetAll,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useBlockContext must be used within a BlockProvider");
  }
  return context;
};
