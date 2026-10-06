import {
  computeBandGeometry,
  computeBandHeightMm,
  PREVIEW_WRITING_WIDTH_MM,
} from "@/lib/guide-geometry";

interface GuideBandPreviewProps {
  bodyHeightMm: number;
}

export default function GuideBandPreview({
  bodyHeightMm,
}: GuideBandPreviewProps) {
  const width = PREVIEW_WRITING_WIDTH_MM;
  const height = computeBandHeightMm(bodyHeightMm);
  const band = computeBandGeometry(bodyHeightMm, width);

  return (
    <div
      className="w-full max-w-xl rounded border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Aperçu d'une bande de réglure, hauteur de corps ${bodyHeightMm} mm`}
      >
        <rect
          x={band.writingLeft}
          y={band.ascenderBottom}
          width={band.writingRight - band.writingLeft}
          height={band.bodyBottom - band.ascenderBottom}
          fill="#f0f0f0"
          className="dark:fill-zinc-800"
        />
        {band.obliques.map((seg, i) => (
          <line
            key={i}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke="#c4c4c4"
            strokeWidth={0.15}
          />
        ))}
        <line
          x1={band.writingLeft}
          y1={band.top}
          x2={band.writingRight}
          y2={band.top}
          stroke="#555"
          strokeWidth={0.25}
        />
        <line
          x1={band.writingLeft}
          y1={band.ascenderTop}
          x2={band.writingRight}
          y2={band.ascenderTop}
          stroke="#555"
          strokeWidth={0.25}
        />
        <line
          x1={band.writingLeft}
          y1={band.ascenderBottom}
          x2={band.writingRight}
          y2={band.ascenderBottom}
          stroke="#555"
          strokeWidth={0.25}
        />
        <line
          x1={band.writingLeft}
          y1={band.bodyBottom}
          x2={band.writingRight}
          y2={band.bodyBottom}
          stroke="#555"
          strokeWidth={0.25}
        />
        <line
          x1={band.writingLeft}
          y1={band.descenderMid}
          x2={band.writingRight}
          y2={band.descenderMid}
          stroke="#555"
          strokeWidth={0.25}
        />
        <line
          x1={band.writingLeft}
          y1={band.bottom}
          x2={band.writingRight}
          y2={band.bottom}
          stroke="#555"
          strokeWidth={0.25}
        />
      </svg>
    </div>
  );
}
