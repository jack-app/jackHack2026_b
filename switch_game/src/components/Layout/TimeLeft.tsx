export interface TimeLeftProps {
  timeLeft: number | null;
}

export default function TimeLeft({ timeLeft }: TimeLeftProps) {
  if (timeLeft===null) {
    return null;
  }

  const minutes = Math.floor(timeLeft/60)
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const Urgent = timeLeft <= 10;
  const leftTimeStyle = Urgent ? 'text-yellow-500 animate-pulse' : 'text-gray-50';


  return (

   <div id="timer" className="text-gray-50 text-4xl font-bold p-9 ">
      {/* TODO: implement - display time_left in seconds; show nothing when null */}
    
     <div className="text-sm">
       TIME LEFT
     </div>

     <span className={leftTimeStyle}>
      {formattedTime}
     </span>

   </div>
  );
}
