import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import catSvgUrl from "../assets/cat.svg?url";
import { getCanvasMousePos, checkCollision } from "../util/utilfunc";
import SpeechBubble from "./SpeechBubble";
import { useGlobalContext } from "../GlobalContext/GlobalContext";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 480;

const PreviewArea = () => {
  const {
    spriteMoveData,
    dirobj,
    selectedSpriteId,
    setSelectedSpriteId,
    resetAll,
  } = useGlobalContext();

  const canvasRef = useRef(null);
  const nextSpriteId = useRef(0);
  const animationFrameIdRef = useRef(null);
  const spriteDimensionsRef = useRef({ width: 0, height: 0 });
  const bubbleTimeoutRefs = useRef({});
  const spriteStepsRef = useRef({});
  const currentMoveData = useRef({});
  const initialMoveData = useRef({});
  const currentDirection = useRef({});
  const [catImage, setCatImage] = useState(null);
  const [sprites, setSprites] = useState([]);
  const [initialSpritePositions, setInitialSpritePositions] = useState({});
  const [draggingSpriteInfo, setDraggingSpriteInfo] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeBubbles, setActiveBubbles] = useState({});
  const [pausedSprites, setPausedSprites] = useState({});

  useEffect(() => {
    currentMoveData.current = spriteMoveData;
    // Store a deep copy of the initial move data for reset purposes
    initialMoveData.current = JSON.parse(JSON.stringify(spriteMoveData || {}));
  }, [spriteMoveData]);

  const handleReset = () => {
    setSprites([]);
    setSelectedSpriteId(null);
    spriteStepsRef.current = {};
    currentDirection.current = {};
    currentMoveData.current = {};
    initialMoveData.current = {};
    setPausedSprites({});
    setActiveBubbles({});
    setInitialSpritePositions({});
    nextSpriteId.current = 0;

    resetAll();
  };

  const handleResetPosition = () => {
    if (isAnimating) {
      // Stop animation first
      setIsAnimating(false);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }

    // Reset sprites to their initial positions
    setSprites((prev) =>
      prev.map((sprite) => ({
        ...sprite,
        x: initialSpritePositions[sprite.id]?.x ?? sprite.x,
        y: initialSpritePositions[sprite.id]?.y ?? sprite.y,
        angle: initialSpritePositions[sprite.id]?.angle ?? 0,
      }))
    );

    // Reset animation state and actions
    spriteStepsRef.current = {};

    // Completely reset action state for each sprite
    Object.keys(currentDirection.current).forEach((key) => {
      if (currentDirection.current[key]) {
        // Reset position in action sequence
        currentDirection.current[key].min = 0;
        // Reset direction to initial direction (forward)
        currentDirection.current[key].dirn = 1;
      }
    });

    // Reset any swapped or modified actions back to original
    if (
      initialMoveData.current &&
      Object.keys(initialMoveData.current).length > 0
    ) {
      // Deep copy to ensure we're not keeping any references to modified data
      currentMoveData.current = JSON.parse(
        JSON.stringify(initialMoveData.current)
      );
    }

    // Clear any active speech bubbles
    setActiveBubbles({});
    setPausedSprites({});
    Object.values(bubbleTimeoutRefs.current).forEach(clearTimeout);
    bubbleTimeoutRefs.current = {};
  };

  useEffect(() => {
    currentDirection.current = dirobj;
  }, [dirobj]);

  useEffect(() => {
    const img = new Image();
    let isMounted = true;
    img.onload = () => {
      if (isMounted) {
        setCatImage(img);
        spriteDimensionsRef.current = { width: img.width, height: img.height };
        const initialSprites = [];
        const id0 = nextSpriteId.current++;

        const initialX = CANVAS_WIDTH * 0.25 - img.width / 2;
        const initialY = CANVAS_HEIGHT / 2 - img.height / 2;

        initialSprites.push({
          id: id0,
          x: initialX,
          y: initialY,
          angle: 0,
          message: null,
        });

        setInitialSpritePositions((prev) => ({
          ...prev,
          [id0]: { x: initialX, y: initialY, angle: 0 },
        }));

        setSprites(initialSprites);
      }
    };
    img.onerror = (err) => {
      if (isMounted) {
        console.error(err);
        setCatImage(null);
      }
    };
    img.src = catSvgUrl;

    return () => {
      isMounted = false;
      img.onload = null;
      img.onerror = null;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      Object.values(bubbleTimeoutRefs.current).forEach(clearTimeout);
      bubbleTimeoutRefs.current = {};
    };
  }, [catSvgUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !catImage) {
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const { width, height } = spriteDimensionsRef.current;
    if (!width || !height) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sprites.forEach((sprite) => {
      const { id, x, y, angle } = sprite;
      const rad = angle * (Math.PI / 180);
      const drawX = x;
      const drawY = y;

      ctx.save();
      ctx.translate(drawX + width / 2, drawY + height / 2);
      ctx.rotate(rad);
      ctx.drawImage(catImage, -width / 2, -height / 2, width, height);
      ctx.restore();

      if (id === selectedSpriteId && !isAnimating) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, width, height);
      }
    });
  }, [sprites, catImage, selectedSpriteId, isAnimating]);

  const handleAdd = useCallback(() => {
    if (!catImage || !canvasRef.current || isAnimating) return;
    const { width, height } = spriteDimensionsRef.current;
    if (!width || !height) return;

    const newId = nextSpriteId.current;
    const initialX = Math.random() * (CANVAS_WIDTH - width);
    const initialY = Math.random() * (CANVAS_HEIGHT - height);

    const newSprite = {
      id: newId,
      x: initialX,
      y: initialY,
      angle: 0,
    };

    // Store initial position for reset
    setInitialSpritePositions((prev) => ({
      ...prev,
      [newId]: { x: initialX, y: initialY, angle: 0 },
    }));

    setSprites((prevSprites) => [...prevSprites, newSprite]);
    nextSpriteId.current += 1;
    setSelectedSpriteId(newId);
  }, [catImage, isAnimating, setSelectedSpriteId]);

  const handleMouseDown = useCallback(
    (event) => {
      if (isAnimating) return;
      const canvas = canvasRef.current;
      if (!canvas || !catImage) return;
      const { width, height } = spriteDimensionsRef.current;
      if (!width || !height) return;

      const mousePos = getCanvasMousePos(canvas, event);
      let clickedSprite = null;
      let clickedSpriteId = null;

      for (let i = sprites.length - 1; i >= 0; i--) {
        const sprite = sprites[i];
        if (
          mousePos.x >= sprite.x &&
          mousePos.x <= sprite.x + width &&
          mousePos.y >= sprite.y &&
          mousePos.y <= sprite.y + height
        ) {
          clickedSprite = sprite;
          clickedSpriteId = sprite.id;
          break;
        }
      }

      if (clickedSprite) {
        setSelectedSpriteId(clickedSpriteId);
        const offsetX = mousePos.x - clickedSprite.x;
        const offsetY = mousePos.y - clickedSprite.y;
        setDraggingSpriteInfo({ id: clickedSpriteId, offsetX, offsetY });
        event.preventDefault();
      } else {
        setSelectedSpriteId(null);
        setDraggingSpriteInfo(null);
      }
    },
    [sprites, catImage, isAnimating, setSelectedSpriteId]
  );

  const handleMouseMove = useCallback(
    (event) => {
      if (
        !draggingSpriteInfo ||
        !canvasRef.current ||
        !catImage ||
        isAnimating
      ) {
        if (isAnimating && draggingSpriteInfo) setDraggingSpriteInfo(null);
        return;
      }
      const { width, height } = spriteDimensionsRef.current;
      if (!width || !height) return;

      const { id, offsetX, offsetY } = draggingSpriteInfo;
      const canvas = canvasRef.current;
      const mousePos = getCanvasMousePos(canvas, event);

      let newX = mousePos.x - offsetX;
      let newY = mousePos.y - offsetY;

      newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width));
      newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height));

      setSprites((prevSprites) =>
        prevSprites.map((sprite) =>
          sprite.id === id ? { ...sprite, x: newX, y: newY } : sprite
        )
      );

      // Update initial position when manually moved
      setInitialSpritePositions((prev) => ({
        ...prev,
        [id]: { ...prev[id], x: newX, y: newY },
      }));

      event.preventDefault();
    },
    [draggingSpriteInfo, catImage, isAnimating]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingSpriteInfo(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  const processSpeechAction = useCallback((key, sprite, currIN) => {
    const { action, message, time } = currIN;

    if (bubbleTimeoutRefs.current[sprite.id]) {
      clearTimeout(bubbleTimeoutRefs.current[sprite.id]);
    }

    const { width, height } = spriteDimensionsRef.current;
    const bubbleX = sprite.x + width / 2;
    const bubbleY = sprite.y - 25;
    const duration = (parseFloat(time) || 1) * 1000;

    setActiveBubbles((prev) => ({
      ...prev,
      [sprite.id]: {
        type: action.toLowerCase(),
        text: message,
        x: bubbleX,
        y: bubbleY,
      },
    }));

    setPausedSprites((prev) => ({
      ...prev,
      [key]: true,
    }));

    bubbleTimeoutRefs.current[sprite.id] = setTimeout(() => {
      setActiveBubbles((prev) => {
        const updated = { ...prev };
        delete updated[sprite.id];
        return updated;
      });

      setPausedSprites((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      spriteStepsRef.current[key] = {
        action: currIN.action,
        advanceToNext: true,
      };
    }, duration);
  }, []);

  const animateStep = useCallback(() => {
    const { width: imgWidth, height: imgHeight } = spriteDimensionsRef.current;

    if (!imgWidth || !imgHeight) {
      if (isAnimating) {
        animationFrameIdRef.current = requestAnimationFrame(animateStep);
      }
      return;
    }

    const newSprites = [...sprites];
    let anyUpdated = false;

    for (const key in spriteStepsRef.current) {
      const stepInfo = spriteStepsRef.current[key];
      if (stepInfo.advanceToNext) {
        if (stepInfo.action !== "REP") {
          currentDirection.current[key]["min"] += 1;
        } else {
          currentDirection.current[key]["min"] = 0;
        }
        delete spriteStepsRef.current[key];
        anyUpdated = true;
      }
    }

    const pendingUpdates = [];

    for (const key in currentMoveData.current) {
      if (pausedSprites[key]) continue;

      const mini = currentDirection.current[key]["min"];
      const maxi = currentDirection.current[key]["max"];
      if (mini >= maxi) continue;
      const currIN = currentMoveData.current[key][mini];
      /* if (currIN == undefined) {
        continue;
      } */
      const { vx = 0, vy = 0, vr = 0, action, message, time } = currIN;

      const spriteIndex = newSprites.findIndex((s) => s.id === parseInt(key));
      if (spriteIndex === -1) continue;

      const sprite = newSprites[spriteIndex];

      if ((action === "SAY" || action === "THINK") && message) {
        processSpeechAction(key, sprite, currIN);
        continue;
      }

      const dir = currentDirection.current[key]["dirn"] ?? 1;
      const dX = Number(vx) * dir;
      const dY = Number(vy) * dir;
      const parsedVr = Number(vr);
      const dA = Number.isNaN(parsedVr) ? 0 : parsedVr;

      let pX = sprite.x + dX;
      let pY = sprite.y + dY;
      let pAngle = (sprite.angle + dA) % 360;
      if (pAngle < 0) pAngle += 360;

      let bounced = false;
      if (pX < 0 || pX > CANVAS_WIDTH - imgWidth) {
        pX = Math.max(0, Math.min(pX, CANVAS_WIDTH - imgWidth));
        currentDirection.current[key]["dirn"] *= -1;
        //console.log(JSON.stringify(currentDirection.current, null, 2));

        bounced = true;
      }
      if (pY < 0 || pY > CANVAS_HEIGHT - imgHeight) {
        pY = Math.max(0, Math.min(pY, CANVAS_HEIGHT - imgHeight));
        if (!bounced) currentDirection.current[key]["dirn"] *= -1;
      }

      pendingUpdates.push({
        spriteIndex,
        key,
        oldX: sprite.x,
        oldY: sprite.y,
        newX: pX,
        newY: pY,
        oldAngle: sprite.angle,
        newAngle: pAngle,
        actionType: action,
      });
    }
    const collisionsProcessed = new Set();
    for (let i = 0; i < pendingUpdates.length; i++) {
      const updateA = pendingUpdates[i];
      for (let j = i + 1; j < pendingUpdates.length; j++) {
        const updateB = pendingUpdates[j];

        const collisionKey = [updateA.key, updateB.key].sort().join("-");

        if (collisionsProcessed.has(collisionKey)) continue;

        const collision = checkCollision(
          updateA.newX,
          updateA.newY,
          { x: updateB.newX, y: updateB.newY },
          spriteDimensionsRef.current
        );

        if (collision) {
          //console.log(collisionsProcessed);
          //console.log(currentMoveData.current);
          //console.log(JSON.stringify(currentDirection.current, null, 2));
          collisionsProcessed.add(collisionKey);
          updateA.newX = updateA.oldX;
          updateA.newY = updateA.oldY;
          updateA.newAngle = updateA.oldAngle;
          updateB.newX = updateB.oldX;
          updateB.newY = updateB.oldY;
          updateB.newAngle = updateB.oldAngle;

          let temp = currentMoveData.current[updateA.key];
          currentMoveData.current[updateA.key] =
            currentMoveData.current[updateB.key];
          currentMoveData.current[updateB.key] = temp;

          /* currentDirection.current[updateA.key]["dirn"] *= -1;
          currentDirection.current[updateB.key]["dirn"] *= -1; */
          currentDirection.current[updateA.key]["min"] = 0;
          currentDirection.current[updateB.key]["min"] = 0;
          pausedSprites[updateA.key] = true;
          setTimeout(() => {
            delete pausedSprites[updateA.key];
          }, 16);
        }
      }
    }

    for (const update of pendingUpdates) {
      newSprites[update.spriteIndex] = {
        ...newSprites[update.spriteIndex],
        x: update.newX,
        y: update.newY,
        angle: update.newAngle,
      };

      if (update.actionType !== "REP") {
        currentDirection.current[update.key]["min"] += 1;
      } else {
        currentDirection.current[update.key]["min"] = 0;
      }

      anyUpdated = true;
    }

    if (anyUpdated) {
      setSprites(newSprites);
    }

    if (isAnimating) {
      animationFrameIdRef.current = requestAnimationFrame(animateStep);
    }
  }, [sprites, pausedSprites, isAnimating, processSpeechAction]);

  useEffect(() => {
    if (isAnimating) {
      if (!animationFrameIdRef.current) {
        setSelectedSpriteId(null);
        setDraggingSpriteInfo(null);
        animationFrameIdRef.current = requestAnimationFrame(animateStep);
      }
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (!isAnimating && animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [animateStep, isAnimating, setSelectedSpriteId]);

  const toggleAnimation = () => {
    setIsAnimating((prev) => !prev);
  };

  return (
    <div className="relative flex-none h-full overflow-y-auto p-2 flex flex-col items-center">
      <div className="mb-2 space-x-2 flex items-center">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!catImage || isAnimating}
          title={
            !catImage
              ? "Image loading..."
              : isAnimating
              ? "Stop animation to add"
              : "Add a new sprite"
          }
        >
          {catImage ? "Add Sprite" : "Loading..."}
        </button>
        <button
          onClick={toggleAnimation}
          className={`px-4 py-2 rounded text-white ${
            isAnimating
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={
            !currentMoveData.current || currentMoveData.current.length === 0
          }
          title={
            !currentMoveData.current || currentMoveData.current.length === 0
              ? "No movement data available"
              : isAnimating
              ? "Stop Animation"
              : "Start Animation"
          }
        >
          {isAnimating ? "Stop" : "Start"} Animation
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset All
        </button>
      </div>

      <div className="relative flex justify-center items-center flex-grow w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-gray-300 rounded-lg bg-white touch-none"
        />
        {Object.entries(activeBubbles).map(([spriteId, bubble]) => (
          <SpeechBubble
            key={spriteId}
            type={bubble.type}
            text={bubble.text}
            position={{ x: bubble.x, y: bubble.y }}
          />
        ))}
      </div>

      <div className="mt-1 text-sm text-gray-600">
        Selected Sprite ID:{" "}
        {selectedSpriteId !== null ? selectedSpriteId : "None"}
      </div>
      <button
        onClick={handleResetPosition}
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
      >
        Reset Animation
      </button>
    </div>
  );
};

export default PreviewArea;
