/**
 * Modèle géométrique pur d'une feuille de réglure "anglaise" (cursive/Copperplate).
 * Aucune dépendance à React ni à une librairie de rendu : ce module est partagé
 * tel quel par l'aperçu SVG (components/GuideBandPreview.tsx) et par la génération
 * PDF (lib/generate-pdf.ts), pour ne jamais dupliquer le calcul des lignes.
 *
 * Toutes les coordonnées sont en millimètres, origine en haut à gauche, y croissant
 * vers le bas — c'est à la fois le repère naturel d'un <svg> et celui de jsPDF avec
 * { unit: "mm" }.
 */

export type PageFormat = "a6" | "a5" | "a4";

/** Dimensions ISO 216 (portrait) des formats proposés, et libellé affiché. */
export const PAGE_FORMATS: Record<
  PageFormat,
  { widthMm: number; heightMm: number; label: string }
> = {
  a6: { widthMm: 105, heightMm: 148, label: "A6" },
  a5: { widthMm: 148, heightMm: 210, label: "A5" },
  a4: { widthMm: 210, heightMm: 297, label: "A4" },
};

export const BODY_HEIGHT_DEFAULT_MM = 10;
export const BODY_HEIGHT_MIN_MM = 2;
export const BODY_HEIGHT_MAX_MM = 20;
export const BODY_HEIGHT_STEP_MM = 0.5;

/** Ratios fixes dérivant tous les autres paramètres de la hauteur de corps. */
export const RATIO_ASCENDER = 1; // hampes & hastes = 1 × corps
export const RATIO_DESCENDER = 1.5; // jambages = 1 corps 1/2
export const RATIO_LEADING = 1; // interligne = 1 × corps

/**
 * Demi-corps supplémentaire au-dessus de la ligne des hampes & hastes (zone de
 * débordement pour les lettres arrondies). Confirmé par mesure précise sur le
 * PDF de référence : une barre horizontale isole ce demi-corps en haut de bande.
 */
export const RATIO_OVERSHOOT_TOP = 0.5;

/**
 * Position, à l'intérieur de la zone des jambages, de la barre horizontale qui
 * en isole le dernier demi-corps (mesurée depuis la ligne de base). Avec
 * RATIO_DESCENDER = 1,5, cette barre laisse 1 corps plein puis un dernier
 * demi-corps jusqu'à la limite des jambages — confirmé par la même mesure.
 */
export const RATIO_DESCENDER_SPLIT = 1;

/**
 * Pente fixe, mesurée depuis l'HORIZONTALE (convention calligraphique standard
 * pour l'anglaise/Copperplate). Ne pas confondre avec un angle depuis la verticale :
 * ça donnerait un déport horizontal presque deux fois plus grand et des obliques
 * visuellement trop couchées.
 */
export const SLANT_ANGLE_FROM_HORIZONTAL_DEG = 54;

/** Espacement horizontal entre deux lignes obliques consécutives = 1/2 corps. */
export const RATIO_OBLIQUE_SPACING = 0.5;

export function computeObliqueSpacingMm(bodyHeightMm: number): number {
  return RATIO_OBLIQUE_SPACING * bodyHeightMm;
}

/** Marge uniforme haut/gauche/droite de la page imprimée. */
export const PAGE_MARGIN_MM = 10;

/** Hauteur réservée en bas de page pour le cartouche de légende (0 = pied de page supprimé, test en cours). */
export const LEGEND_BLOCK_HEIGHT_MM = 0;

/** Largeur d'écriture arbitraire utilisée pour l'aperçu d'une bande isolée. */
export const PREVIEW_WRITING_WIDTH_MM = 120;

export type Orientation = "portrait" | "landscape";

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface BandGeometry {
  index: number;
  top: number; // sommet de la bande = début de la zone de débordement (1/2 corps)
  ascenderTop: number; // fin zone de débordement = début zone hampes & hastes
  ascenderBottom: number; // = début zone corps
  bodyBottom: number; // = ligne de base = début zone jambages
  descenderMid: number; // barre isolant le dernier 1/2 corps des jambages
  bottom: number; // fin zone jambages
  writingLeft: number;
  writingRight: number;
  obliques: Segment[]; // déjà rognées au rectangle de la bande
}

export interface GuideLayout {
  orientation: Orientation;
  format: PageFormat;
  bodyHeightMm: number;
  pageWidthMm: number;
  pageHeightMm: number;
  writingLeftMm: number;
  writingRightMm: number;
  writingWidthMm: number;
  bands: BandGeometry[];
  legend: {
    separatorY: number;
    textY: number;
    creditY: number;
    text: string;
    credit: string;
  };
}

/** Garantit une valeur numérique valide dans les bornes acceptées. */
export function clampBodyHeightMm(value: number): number {
  if (!Number.isFinite(value)) return BODY_HEIGHT_DEFAULT_MM;
  return Math.min(BODY_HEIGHT_MAX_MM, Math.max(BODY_HEIGHT_MIN_MM, value));
}

/** Hauteur totale d'une bande = débordement + hampes/hastes + corps + jambages. */
export function computeBandHeightMm(bodyHeightMm: number): number {
  return (
    (RATIO_OVERSHOOT_TOP + RATIO_ASCENDER + 1 + RATIO_DESCENDER) * bodyHeightMm
  );
}

/**
 * Déport horizontal d'une oblique sur toute la hauteur d'une bande, pour une
 * pente fixée à SLANT_ANGLE_FROM_HORIZONTAL_DEG degrés depuis l'horizontale.
 * Seul endroit à corriger si la convention d'angle devait être revue.
 */
export function obliqueHorizontalOffsetMm(bandHeightMm: number): number {
  const angleRad = (SLANT_ANGLE_FROM_HORIZONTAL_DEG * Math.PI) / 180;
  return bandHeightMm / Math.tan(angleRad);
}

/**
 * Rogne un segment au rectangle [left,right] x [top,bottom] (algorithme de
 * Liang-Barsky). Retourne null si le segment est entièrement hors du rectangle.
 */
function clipSegmentToRect(
  seg: Segment,
  left: number,
  right: number,
  top: number,
  bottom: number,
): Segment | null {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  let t0 = 0;
  let t1 = 1;

  const edges: Array<[number, number]> = [
    [-dx, seg.x1 - left],
    [dx, right - seg.x1],
    [-dy, seg.y1 - top],
    [dy, bottom - seg.y1],
  ];

  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null; // parallèle à l'arête et à l'extérieur
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }

  return {
    x1: seg.x1 + t0 * dx,
    y1: seg.y1 + t0 * dy,
    x2: seg.x1 + t1 * dx,
    y2: seg.y1 + t1 * dy,
  };
}

/**
 * Construit une bande unique (4 lignes horizontales implicites via ses bornes +
 * obliques déjà rognées), positionnée à (originX, originY), sur une largeur
 * d'écriture donnée. Réutilisée pour l'aperçu (une bande isolée) et pour
 * computePageLayout (n bandes empilées sur une page).
 */
export function computeBandGeometry(
  bodyHeightMm: number,
  writingWidthMm: number,
  originX = 0,
  originY = 0,
  index = 0,
): BandGeometry {
  const bandHeight = computeBandHeightMm(bodyHeightMm);

  const top = originY;
  const ascenderTop = top + RATIO_OVERSHOOT_TOP * bodyHeightMm;
  const ascenderBottom = ascenderTop + RATIO_ASCENDER * bodyHeightMm;
  const bodyBottom = ascenderBottom + bodyHeightMm;
  const descenderMid = bodyBottom + RATIO_DESCENDER_SPLIT * bodyHeightMm;
  const bottom = originY + bandHeight;

  const writingLeft = originX;
  const writingRight = originX + writingWidthMm;

  const dx = obliqueHorizontalOffsetMm(bandHeight);
  const obliqueSpacing = computeObliqueSpacingMm(bodyHeightMm);

  // Génère des ancrages en bas de bande largement au-delà de la largeur
  // d'écriture (dans les deux sens) pour couvrir tout débordement dû au
  // déport dx, puis rogne chaque segment au rectangle de la bande.
  const obliques: Segment[] = [];
  const startX = writingLeft - dx - obliqueSpacing;
  const endX = writingRight + dx + obliqueSpacing;
  for (let x = startX; x <= endX; x += obliqueSpacing) {
    const raw: Segment = { x1: x, y1: bottom, x2: x + dx, y2: top };
    const clipped = clipSegmentToRect(
      raw,
      writingLeft,
      writingRight,
      top,
      bottom,
    );
    if (clipped) obliques.push(clipped);
  }

  return {
    index,
    top,
    ascenderTop,
    ascenderBottom,
    bodyBottom,
    descenderMid,
    bottom,
    writingLeft,
    writingRight,
    obliques,
  };
}

function formatMm(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatLegendText(bodyHeightMm: number): string {
  return (
    `ANGLAISE – Hauteur de corps : ${formatMm(bodyHeightMm)} mm – ` +
    `jambages : 1 corps 1/2 – hampes & hastes : 1 corps – ` +
    `interligne : 1 corps – pente : ${SLANT_ANGLE_FROM_HORIZONTAL_DEG}°`
  );
}

/** Calcule la mise en page complète d'une page : bandes + légende. */
export function computePageLayout(
  bodyHeightMm: number,
  orientation: Orientation,
  format: PageFormat = "a4",
): GuideLayout {
  const { widthMm, heightMm } = PAGE_FORMATS[format];
  const pageWidthMm = orientation === "portrait" ? widthMm : heightMm;
  const pageHeightMm = orientation === "portrait" ? heightMm : widthMm;

  const writingLeftMm = PAGE_MARGIN_MM;
  const writingRightMm = pageWidthMm - PAGE_MARGIN_MM;
  const writingWidthMm = writingRightMm - writingLeftMm;

  const bandHeight = computeBandHeightMm(bodyHeightMm);
  const leading = RATIO_LEADING * bodyHeightMm;
  const avail = pageHeightMm - 2 * PAGE_MARGIN_MM - LEGEND_BLOCK_HEIGHT_MM;
  const bandCount = Math.max(
    1,
    Math.floor((avail + leading) / (bandHeight + leading)),
  );

  const bands: BandGeometry[] = [];
  for (let i = 0; i < bandCount; i++) {
    const originY = PAGE_MARGIN_MM + i * (bandHeight + leading);
    bands.push(
      computeBandGeometry(bodyHeightMm, writingWidthMm, writingLeftMm, originY, i),
    );
  }

  const legendZoneTop = pageHeightMm - PAGE_MARGIN_MM - LEGEND_BLOCK_HEIGHT_MM;

  return {
    orientation,
    format,
    bodyHeightMm,
    pageWidthMm,
    pageHeightMm,
    writingLeftMm,
    writingRightMm,
    writingWidthMm,
    bands,
    legend: {
      separatorY: legendZoneTop + 4,
      textY: legendZoneTop + 13,
      creditY: legendZoneTop + 19,
      text: formatLegendText(bodyHeightMm),
      credit: "Généré avec Guide-Âne Générateur",
    },
  };
}
