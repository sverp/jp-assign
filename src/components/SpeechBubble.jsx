export default function SpeechBubble({ type, text, position }) {
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
  let ntext = text.split("_");
  return (
    <div className={`${baseClasses} ${typeClasses}`} style={bubbleStyle}>
      {ntext[0]}
      {type === "think" ? <ThinkBubbles /> : <SpeechTail />}
    </div>
  );
}
