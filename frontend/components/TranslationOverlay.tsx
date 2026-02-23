'use client';

import type { ExtractedElement, PageDimensions, ScreenCoordinates } from '@/lib/types';

interface TranslationOverlayProps {
  elements: ExtractedElement[];
  pageDimensions: PageDimensions;
}

/**
 * Converts PDF coordinates (bottom-origin) to screen coordinates (top-origin)
 *
 * PDF Coordinate System: (0,0) = bottom-left
 * Screen Coordinate System: (0,0) = top-left
 *
 * @param pdfCoord - The PDF coordinate from analysis result
 * @param pageDimensions - The rendered page dimensions
 * @returns Screen coordinates or null if invalid
 */
function convertPDFToScreenCoordinates(
  pdfCoord: { x: { left_x: string; right_x: string }; y: { lower_y: string; upper_y: string } },
  pageDimensions: PageDimensions
): ScreenCoordinates | null {
  // Calculate scale factors
  const scaleX = pageDimensions.width / pageDimensions.originalWidth;
  const scaleY = pageDimensions.height / pageDimensions.originalHeight;

  // Parse coordinates (handle "unknown" case)
  const leftX = parseFloat(pdfCoord.x.left_x);
  const rightX = parseFloat(pdfCoord.x.right_x);
  const lowerY = parseFloat(pdfCoord.y.lower_y);
  const upperY = parseFloat(pdfCoord.y.upper_y);

  // Validate coordinates
  if (isNaN(leftX) || isNaN(rightX) || isNaN(lowerY) || isNaN(upperY)) {
    return null; // Skip invalid coordinates
  }

  // Convert X (same direction, just scale)
  const screenLeft = leftX * scaleX;
  const screenWidth = (rightX - leftX) * scaleX;

  // Convert Y (FLIP vertical axis)
  // In PDF: (0,0) is bottom-left, upperY > lowerY
  // In Screen: (0,0) is top-left, so we need to flip
  const screenTop = (pageDimensions.originalHeight - upperY) * scaleY;
  const screenHeight = (upperY - lowerY) * scaleY;

  // Check for out-of-bounds
  if (
    screenLeft < 0 ||
    screenTop < 0 ||
    screenLeft > pageDimensions.width ||
    screenTop > pageDimensions.height
  ) {
    console.warn('Element outside page bounds:', {
      screenLeft,
      screenTop,
      pageDimensions,
      pdfCoord
    });
    // Still render it - might be partially visible
  }

  // Ensure minimum dimensions for visibility
  const finalWidth = Math.max(screenWidth, 50);
  const finalHeight = Math.max(screenHeight, 20);

  return {
    left: screenLeft,
    top: screenTop,
    width: finalWidth,
    height: finalHeight
  };
}

export default function TranslationOverlay({ elements, pageDimensions }: TranslationOverlayProps) {
  if (!elements || elements.length === 0) {
    return null;
  }

  // Log page dimensions and coordinate conversion for debugging
  console.log('='.repeat(80));
  console.log('TRANSLATION OVERLAY - PAGE DIMENSIONS:');
  console.log('  Rendered size:', pageDimensions.width, 'x', pageDimensions.height, 'px');
  console.log('  Original PDF size:', pageDimensions.originalWidth, 'x', pageDimensions.originalHeight, 'pts');
  console.log('  Scale factors:', {
    x: pageDimensions.width / pageDimensions.originalWidth,
    y: pageDimensions.height / pageDimensions.originalHeight
  });
  console.log('='.repeat(80));

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: `${pageDimensions.width}px`,
        height: `${pageDimensions.height}px`
      }}
    >
      {elements.map((element, index) => {
        // Skip elements without translations
        if (!element.value_en || element.value_en.trim() === '') {
          return null;
        }

        // Convert coordinates
        const screenCoords = convertPDFToScreenCoordinates(
          element.coordinate,
          pageDimensions
        );

        // Skip if coordinates are invalid
        if (!screenCoords) {
          console.warn('Skipping element with invalid coordinates:', element);
          return null;
        }

        // Log coordinate conversion details
        console.log(`Overlay [${index}]:`, {
          value: element.value,
          translation: element.value_en,
          pdfCoords: {
            x: `${element.coordinate.x.left_x} - ${element.coordinate.x.right_x}`,
            y: `${element.coordinate.y.lower_y} - ${element.coordinate.y.upper_y}`
          },
          screenCoords: {
            left: screenCoords.left.toFixed(2),
            top: screenCoords.top.toFixed(2),
            width: screenCoords.width.toFixed(2),
            height: screenCoords.height.toFixed(2)
          }
        });

        return (
          <div
            key={`overlay-${index}`}
            className="absolute bg-yellow-200/70 border border-yellow-400 text-xs text-gray-900 p-1 overflow-hidden pointer-events-auto"
            style={{
              left: `${screenCoords.left}px`,
              top: `${screenCoords.top}px`,
              width: `${screenCoords.width}px`,
              minHeight: `${screenCoords.height}px`,
              maxHeight: `${screenCoords.height}px`
            }}
            title={`Original: ${element.value}\nTranslation: ${element.value_en}`}
          >
            <div className="line-clamp-3">
              {element.value_en}
            </div>
          </div>
        );
      })}
    </div>
  );
}
