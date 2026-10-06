import {
  BODY_HEIGHT_MAX_MM,
  BODY_HEIGHT_MIN_MM,
  BODY_HEIGHT_STEP_MM,
  PAGE_FORMATS,
  type Orientation,
  type PageFormat,
} from "@/lib/guide-geometry";

const FORMAT_ORDER: PageFormat[] = ["a6", "a5", "a4"];

interface GuideFormProps {
  bodyHeightMmRaw: number;
  onBodyHeightMmChange: (value: number) => void;
  format: PageFormat;
  onFormatChange: (value: PageFormat) => void;
  orientation: Orientation;
  onOrientationChange: (value: Orientation) => void;
  onDownload: () => void;
  isGenerating: boolean;
  bandCount: number;
}

export default function GuideForm({
  bodyHeightMmRaw,
  onBodyHeightMmChange,
  format,
  onFormatChange,
  orientation,
  onOrientationChange,
  onDownload,
  isGenerating,
  bandCount,
}: GuideFormProps) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="body-height"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Hauteur de corps (mm)
        </label>
        <input
          id="body-height"
          type="number"
          min={BODY_HEIGHT_MIN_MM}
          max={BODY_HEIGHT_MAX_MM}
          step={BODY_HEIGHT_STEP_MM}
          value={Number.isNaN(bodyHeightMmRaw) ? "" : bodyHeightMmRaw}
          onChange={(e) => onBodyHeightMmChange(e.target.valueAsNumber)}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Les autres réglages sont dérivés automatiquement : jambages = 1,5×,
          hampes &amp; hastes = 1×, interligne = 1× la hauteur de corps, pente
          fixe à 54°.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Format
        </span>
        <div className="inline-flex overflow-hidden rounded border border-zinc-300 dark:border-zinc-700">
          {FORMAT_ORDER.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFormatChange(f)}
              aria-pressed={format === f}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                format === f
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
              }`}
            >
              {PAGE_FORMATS[f].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Orientation
        </span>
        <div className="inline-flex overflow-hidden rounded border border-zinc-300 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => onOrientationChange("portrait")}
            aria-pressed={orientation === "portrait"}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              orientation === "portrait"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
            }`}
          >
            Portrait
          </button>
          <button
            type="button"
            onClick={() => onOrientationChange("landscape")}
            aria-pressed={orientation === "landscape"}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              orientation === "landscape"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
            }`}
          >
            Paysage
          </button>
        </div>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Avec ces réglages :{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {bandCount} bande{bandCount > 1 ? "s" : ""}
        </span>{" "}
        sur une page {PAGE_FORMATS[format].label}{" "}
        {orientation === "portrait" ? "portrait" : "paysage"}.
      </p>

      <button
        type="button"
        onClick={onDownload}
        disabled={isGenerating}
        className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isGenerating ? "Génération…" : "Télécharger le PDF"}
      </button>
    </div>
  );
}
