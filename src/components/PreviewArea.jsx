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

  const [catImage, setCatImage] = useState(null);
  const [sprites, setSprites] = useState([]);
  const [draggingSpriteInfo, setDraggingSpriteInfo] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentDirection, setCurrentDirection] = useState({});
  const [activeBubbles, setActiveBubbles] = useState({});
  const [pausedSprites, setPausedSprites] = useState({});

  const currentMoveData = useMemo(() => spriteMoveData || {}, [spriteMoveData]);

  const handleReset = () => {
    setSprites([]);
    setSelectedSpriteId(null);
    spriteStepsRef.current = {};
    setCurrentDirection({});
    setPausedSprites({});
    setActiveBubbles({});
    nextSpriteId.current = 0;

    resetAll();
  };

  useEffect(() => {
    const fixed = {};
    for (const key in dirobj) {
      fixed[String(key)] = dirobj[key];
    }
    setCurrentDirection(fixed);
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
        initialSprites.push({
          id: id0,
          x: CANVAS_WIDTH * 0.25 - img.width / 2,
          y: CANVAS_HEIGHT / 2 - img.height / 2,
          angle: 0,
          message: null,
        });

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
    const newSprite = {
      id: newId,
      x: Math.random() * (CANVAS_WIDTH - width),
      y: Math.random() * (CANVAS_HEIGHT - height),
      angle: 0,
    };

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

    const localDir = structuredClone(currentDirection);
    const newSprites = [...sprites];
    let anyUpdated = false;

    for (const key in spriteStepsRef.current) {
      const stepInfo = spriteStepsRef.current[key];
      if (stepInfo.advanceToNext) {
        if (stepInfo.action !== "REP") {
          localDir[key]["min"] += 1;
        } else {
          localDir[key]["min"] = 0;
        }
        delete spriteStepsRef.current[key];
        anyUpdated = true;
      }
    }

    for (const key in currentMoveData) {
      if (pausedSprites[key]) continue;

      const mini = localDir[key]["min"];
      const maxi = localDir[key]["max"];
      if (mini >= maxi) continue;

      const currIN = currentMoveData[key][mini];
      console.log(currIN);
      const { vx = 0, vy = 0, vr = 0, action, message, time } = currIN;

      const spriteIndex = newSprites.findIndex((s) => s.id === parseInt(key));
      if (spriteIndex === -1) continue;

      const sprite = newSprites[spriteIndex];
      if ((action === "SAY" || action === "THINK") && message) {
        processSpeechAction(key, sprite, currIN);
        continue;
      }

      const dir = localDir[key]["dirn"] ?? 1;
      const dX = Number(vx) * dir;
      const dY = Number(vy) * dir;
      const parsedVr = Number(vr);
      const dA = Number.isNaN(parsedVr) ? 0 : parsedVr * dir;
      let pX = sprite.x + dX;
      let pY = sprite.y + dY;
      let pAngle = (sprite.angle + dA) % 360;
      if (pAngle < 0) pAngle += 360;

      let bounced = false;
      if (pX < 0 || pX > CANVAS_WIDTH - imgWidth) {
        pX = Math.max(0, Math.min(pX, CANVAS_WIDTH - imgWidth));
        localDir[key]["dirn"] *= -1;
        bounced = true;
      }
      if (pY < 0 || pY > CANVAS_HEIGHT - imgHeight) {
        pY = Math.max(0, Math.min(pY, CANVAS_HEIGHT - imgHeight));
        if (!bounced) localDir[key]["dirn"] *= -1;
      }

      for (let i = 0; i < newSprites.length; i++) {
        if (i === spriteIndex) continue;
        const other = newSprites[i];
        const side = checkCollision(pX, pY, other, spriteDimensionsRef.current);
        if (side) {
          pX = sprite.x;
          pY = sprite.y;
          localDir[key]["dirn"] *= -1;
          localDir[other.id]["dirn"] *= -1;
          break;
        }
      }

      newSprites[spriteIndex] = {
        ...sprite,
        x: pX,
        y: pY,
        angle: pAngle,
      };

      if (action !== "REP") {
        localDir[key]["min"] += 1;
      } else {
        localDir[key]["min"] = 0;
      }

      anyUpdated = true;
    }

    if (anyUpdated) {
      setSprites(newSprites);
      setCurrentDirection(localDir);
    }

    if (isAnimating) {
      animationFrameIdRef.current = requestAnimationFrame(animateStep);
    }
  }, [
    currentMoveData,
    currentDirection,
    sprites,
    pausedSprites,
    isAnimating,
    processSpeechAction,
  ]);

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
  }, [currentMoveData, animateStep, isAnimating, setSelectedSpriteId]);

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
          disabled={!currentMoveData || currentMoveData.length === 0}
          title={
            !currentMoveData || currentMoveData.length === 0
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
          Reset
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
    </div>
  );
};

export default PreviewArea;
