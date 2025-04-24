import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import catSvgUrl from "../assets/cat.svg?url";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 480;

const getCanvasMousePos = (canvas, event) => {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
};

const checkCollision = (futX, futY, sprite2, dimensions) => {
  if (!dimensions || !dimensions.width || !dimensions.height) return null;

  const futW = dimensions.width;
  const futH = dimensions.height;
  const sprX = sprite2.x;
  const sprY = sprite2.y;
  const sprW = dimensions.width;
  const sprH = dimensions.height;

  const isColliding =
    futX < sprX + sprW &&
    futX + futW > sprX &&
    futY < sprY + sprH &&
    futY + futH > sprY;

  if (!isColliding) return null;

  const overlapLeft = futX + futW - sprX;
  const overlapRight = sprX + sprW - futX;
  const overlapTop = futY + futH - sprY;
  const overlapBottom = sprY + sprH - futY;

  const minOverlap = Math.min(
    overlapLeft,
    overlapRight,
    overlapTop,
    overlapBottom
  );

  if (minOverlap === overlapLeft) return "left";
  if (minOverlap === overlapRight) return "right";
  if (minOverlap === overlapTop) return "top";
  if (minOverlap === overlapBottom) return "bottom";

  return null;
};

const SpeechBubble = ({ type, text, position }) => {
  const bubbleStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: "translateX(-50%)",
  };

  const baseClasses = `
    absolute
    bg-white
    border-2
    border-black
    p-2 text-sm
    min-w-[60px]
    max-w-[150px]
    z-10
    shadow-md
    text-center
  `;

  const typeClasses = type === "think" ? "rounded-full" : "rounded-lg";

  const SpeechTail = () => (
    <div
      className="absolute left-1/2 -bottom-[9px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-black"
      style={{ transform: "translateX(-50%)" }}
    >
      <div className="absolute -top-[12px] -left-[6px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
    </div>
  );

  const ThinkBubbles = () => (
    <div
      className="absolute -bottom-5 left-1/2"
      style={{ transform: "translateX(-60%)" }}
    >
      <div className="absolute bottom-0 w-3 h-3 bg-white border border-black rounded-full"></div>
      <div className="absolute -bottom-3 -left-3 w-2 h-2 bg-white border border-black rounded-full"></div>
    </div>
  );
  console.log("tt", text);
  let ntext = text.split("_");
  return (
    <div className={`${baseClasses} ${typeClasses}`} style={bubbleStyle}>
      {ntext[0]}
      {type === "think" ? <ThinkBubbles /> : <SpeechTail />}
    </div>
  );
};

const PreviewArea = ({
  spriteMoveData,
  dirobj,
  selectedSpriteId,
  setSelectedSpriteId,
}) => {
  const canvasRef = useRef(null);
  const nextSpriteId = useRef(0);
  const animationFrameIdRef = useRef(null);
  const spriteDimensionsRef = useRef({ width: 0, height: 0 });
  const bubbleTimeoutRefs = useRef({});

  const [catImage, setCatImage] = useState(null);
  const [sprites, setSprites] = useState([]);
  const [draggingSpriteInfo, setDraggingSpriteInfo] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentDirection, setCurrentDirection] = useState({});
  const [activeBubbles, setActiveBubbles] = useState({});

  const currentMoveData = useMemo(() => spriteMoveData || [], [spriteMoveData]);

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
        const id1 = nextSpriteId.current++;
        initialSprites.push({
          id: id1,
          x: CANVAS_WIDTH * 0.75 - img.width / 2,
          y: CANVAS_HEIGHT / 2 - img.height / 2,
          angle: 0,
          message: null,
        });
        setSprites(initialSprites);
        setCurrentDirection((prev) => ({
          ...prev,
          [String(id0)]: 1,
          [String(id1)]: 1,
        }));
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
      const { id, x, y, angle, message } = sprite;
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

  useEffect(() => {
    if (!spriteDimensionsRef.current.height) {
      return;
    }

    const newActiveBubbles = { ...activeBubbles };
    let bubblesChanged = false;

    currentMoveData.forEach(({ id, action, message, time }) => {
      const sprite = sprites.find((s) => s.id === id);
      if (sprite && (action === "SAY" || action === "THINK") && message) {
        const duration = (parseFloat(time) || 1) * 1000;

        const bubbleX = sprite.x + spriteDimensionsRef.current.width / 2;
        const bubbleY = sprite.y - 25;
        const existing = activeBubbles[id];
        if (
          !existing ||
          existing.text !== message ||
          existing.type !== action.toLowerCase()
        ) {
          if (bubbleTimeoutRefs.current[id]) {
            clearTimeout(bubbleTimeoutRefs.current[id]);
          }

          newActiveBubbles[id] = {
            type: action.toLowerCase(),
            text: message,
            x: bubbleX,
            y: bubbleY,
          };
          bubblesChanged = true;

          bubbleTimeoutRefs.current[id] = setTimeout(() => {
            setActiveBubbles((prev) => {
              const updated = { ...prev };
              delete updated[id];
              return updated;
            });
          }, duration);
        }
      }
    });

    if (bubblesChanged) {
      setActiveBubbles(newActiveBubbles);
    }

    return () => {};
  }, [currentMoveData, sprites, spriteDimensionsRef.current.height]);

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
    setCurrentDirection((prev) => ({ ...prev, [String(newId)]: 1 }));
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

  const animateStep = useCallback(() => {
    const { width: imgWidth, height: imgHeight } = spriteDimensionsRef.current;
    if (!imgWidth || !imgHeight) {
      if (isAnimating) {
        animationFrameIdRef.current = requestAnimationFrame(animateStep);
      }
      return;
    }

    setSprites((prevSprites) => {
      let nextSprites = [...prevSprites];
      let localDir = { ...currentDirection };

      currentMoveData.forEach(
        ({ id, vx = 0, vy = 0, vr = 0, message, type, time }) => {
          const spriteIndex = nextSprites.findIndex((s) => s.id === id);
          if (spriteIndex === -1) return;

          const sprite = nextSprites[spriteIndex];
          const dir = localDir[String(sprite.id)] ?? 1;

          let dX = vx * dir;
          let dY = vy * dir;
          let pX = sprite.x + dX;
          let pY = sprite.y + dY;
          let pAngle = (sprite.angle + vr * dir) % 360;
          if (pAngle < 0) pAngle += 360;

          let bounced = false;
          if (pX < 0 || pX > CANVAS_WIDTH - imgWidth) {
            pX = Math.max(0, Math.min(pX, CANVAS_WIDTH - imgWidth));
            localDir[String(sprite.id)] *= -1;
            bounced = true;
          }
          if (pY < 0 || pY > CANVAS_HEIGHT - imgHeight) {
            pY = Math.max(0, Math.min(pY, CANVAS_HEIGHT - imgHeight));
            if (!bounced) localDir[String(sprite.id)] *= -1;
          }

          for (let i = 0; i < nextSprites.length; i++) {
            if (i === spriteIndex) continue;

            const other = nextSprites[i];
            const side = checkCollision(
              pX,
              pY,
              other,
              spriteDimensionsRef.current
            );
            if (side) {
              pX = sprite.x;
              pY = sprite.y;
              localDir[String(sprite.id)] *= -1;
              localDir[String(other.id)] *= -1;
              break;
            }
          }

          nextSprites[spriteIndex] = {
            ...sprite,
            x: pX,
            y: pY,
            angle: pAngle,
            message,
            type,
            time,
          };
        }
      );

      setCurrentDirection(localDir);

      return nextSprites;
    });

    if (isAnimating) {
      animationFrameIdRef.current = requestAnimationFrame(animateStep);
    }
  }, [currentMoveData, currentDirection, isAnimating]);

  useEffect(() => {
    const hasAnimationActions = currentMoveData.some(
      ({ action, vx, vy, vr }) =>
        action === "SAY" ||
        action === "THINK" ||
        vx !== 0 ||
        vy !== 0 ||
        vr !== 0
    );
    if (hasAnimationActions && isAnimating) {
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
        <span
          className={`ml-4 text-sm font-medium ${
            isAnimating ? "text-purple-600" : "text-gray-500"
          }`}
        >
          {isAnimating ? "Animation Running" : "Animation Idle"}
        </span>
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
