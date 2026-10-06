import {
  computePageLayout,
  type Orientation,
  type PageFormat,
} from "@/lib/guide-geometry";

function formatMm(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function buildFileName(
  bodyHeightMm: number,
  orientation: Orientation,
  format: PageFormat,
): string {
  return `guide-ane-anglaise-${formatMm(bodyHeightMm)}mm-${format}-${orientation}.pdf`;
}

/**
 * Génère le PDF de réglure et déclenche son téléchargement côté navigateur.
 * jsPDF est importé dynamiquement (jamais en haut de fichier) pour ne pas
 * charger la librairie au SSR ni alourdir le bundle initial de l'app.
 */
export async function downloadGuidePdf(params: {
  bodyHeightMm: number;
  orientation: Orientation;
  format: PageFormat;
}): Promise<void> {
  const { bodyHeightMm, orientation, format } = params;
  const { jsPDF } = await import("jspdf");

  const layout = computePageLayout(bodyHeightMm, orientation, format);
  const doc = new jsPDF({ unit: "mm", format, orientation });

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.1);

  for (const band of layout.bands) {
    // Zone "corps" (x-height) légèrement ombrée, comme dans le modèle de référence.
    doc.setFillColor(243, 243, 243);
    doc.rect(
      band.writingLeft,
      band.ascenderBottom,
      band.writingRight - band.writingLeft,
      band.bodyBottom - band.ascenderBottom,
      "F",
    );

    for (const oblique of band.obliques) {
      doc.line(oblique.x1, oblique.y1, oblique.x2, oblique.y2);
    }

    doc.setLineWidth(0.15);
    doc.line(band.writingLeft, band.top, band.writingRight, band.top);
    doc.line(
      band.writingLeft,
      band.ascenderTop,
      band.writingRight,
      band.ascenderTop,
    );
    doc.line(
      band.writingLeft,
      band.ascenderBottom,
      band.writingRight,
      band.ascenderBottom,
    );
    doc.line(
      band.writingLeft,
      band.bodyBottom,
      band.writingRight,
      band.bodyBottom,
    );
    doc.line(
      band.writingLeft,
      band.descenderMid,
      band.writingRight,
      band.descenderMid,
    );
    doc.line(band.writingLeft, band.bottom, band.writingRight, band.bottom);
    doc.setLineWidth(0.1);
  }

  doc.save(buildFileName(bodyHeightMm, orientation, format));
}
