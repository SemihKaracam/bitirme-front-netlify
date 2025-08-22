import React from "react";

type ProgressBarProps = {
  percentage: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  console.log(percentage);
  return (
    <div className="progress">
      <div
        className="progress-filled"
        style={{ width: `${percentage}%` }}
      >
        {percentage === 100 ? "Yükleme tamamlandı" : `%${percentage}`}
      </div>
    </div>
  );
};

export default ProgressBar;