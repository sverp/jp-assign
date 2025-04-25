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

export { getCanvasMousePos, checkCollision };
