interface PositionStatsProps {
  totalPositions: number;
  vacantPositions: number;
}

export default function PositionStats({
  totalPositions,
  vacantPositions,
}: PositionStatsProps) {
  return (
    <div className="bg-white border border-primary rounded-[10px] p-2.5 w-fit">
      <div className="text-[22px] font-bold leading-[26px]">
        <p className="text-black">
          Total Position:{" "}
          <span className="text-primary">{totalPositions}</span>
        </p>
        <p className="text-neutral-900">
          Vacant: <span className="text-status-off_track">{vacantPositions}</span>
        </p>
      </div>
    </div>
  );
}
