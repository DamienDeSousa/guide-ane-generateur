"use client";

import { useMemo, useState } from "react";
import GuideForm from "@/components/GuideForm";
import GuideBandPreview from "@/components/GuideBandPreview";
import {
  BODY_HEIGHT_DEFAULT_MM,
  clampBodyHeightMm,
  clampLeadingMm,
  computeDefaultLeadingMm,
  computePageLayout,
  type Orientation,
  type PageFormat,
} from "@/lib/guide-geometry";
import { downloadGuidePdf } from "@/lib/generate-pdf";

export default function Home() {
  const [bodyHeightMmRaw, setBodyHeightMmRaw] = useState<number>(
    BODY_HEIGHT_DEFAULT_MM,
  );
  // null = l'interligne suit la hauteur de corps (valeur par défaut).
  const [leadingMmRaw, setLeadingMmRaw] = useState<number | null>(null);
  const [format, setFormat] = useState<PageFormat>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [isGenerating, setIsGenerating] = useState(false);

  // Toujours utiliser la valeur clampée pour l'aperçu et le PDF — jamais la
  // valeur brute, qui peut être NaN/hors bornes pendant la saisie.
  const bodyHeightMm = useMemo(
    () => clampBodyHeightMm(bodyHeightMmRaw),
    [bodyHeightMmRaw],
  );

  const leadingMm = useMemo(
    () =>
      leadingMmRaw === null
        ? computeDefaultLeadingMm(bodyHeightMm)
        : clampLeadingMm(leadingMmRaw, bodyHeightMm),
    [leadingMmRaw, bodyHeightMm],
  );

  const bandCount = useMemo(
    () =>
      computePageLayout(bodyHeightMm, leadingMm, orientation, format).bands
        .length,
    [bodyHeightMm, leadingMm, orientation, format],
  );

  async function handleDownload() {
    setIsGenerating(true);
    try {
      await downloadGuidePdf({ bodyHeightMm, leadingMm, orientation, format });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16 sm:py-24">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Guide-âne — réglure anglaise
          </h1>
          <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Génère une feuille de réglure pour l&apos;écriture cursive
            anglaise (Copperplate), prête à imprimer en PDF, à partir d&apos;une
            seule hauteur de corps.
          </p>
        </div>

        <div className="flex flex-col gap-10 sm:flex-row sm:items-start">
          <GuideForm
            bodyHeightMmRaw={bodyHeightMmRaw}
            onBodyHeightMmChange={setBodyHeightMmRaw}
            leadingMmRaw={leadingMmRaw ?? leadingMm}
            onLeadingMmChange={setLeadingMmRaw}
            format={format}
            onFormatChange={setFormat}
            orientation={orientation}
            onOrientationChange={setOrientation}
            onDownload={handleDownload}
            isGenerating={isGenerating}
            bandCount={bandCount}
          />
          <GuideBandPreview bodyHeightMm={bodyHeightMm} />
        </div>
      </main>
    </div>
  );
}
