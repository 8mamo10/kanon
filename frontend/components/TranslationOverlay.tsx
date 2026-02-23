'use client';

import type { ExtractedElement, PageDimensions, ScreenCoordinates } from '@/lib/types';

interface TranslationOverlayProps {
  elements: ExtractedElement[];
  pageDimensions: PageDimensions;
}

/**
 * Converts normalized coordinates (0-1 range) to screen coordinates (pixels)
 *
 * Normalized Coordinate System: (0,0) = top-left, (1,1) = bottom-right
 * Screen Coordinate System: (0,0) = top-left (same origin)
 *
 * @param coordinate - The normalized coordinate from analysis result
 * @param pageDimensions - The rendered page dimensions
 * @returns Screen coordinates or null if invalid
 */
function convertNormalizedToScreenCoordinates(
  coordinate: { x: { left_x: string; right_x: string }; y: { lower_y: string; upper_y: string } },
  pageDimensions: PageDimensions
): ScreenCoordinates | null {
  // Parse normalized coordinates (0-1 range)
  const leftX = parseFloat(coordinate.x.left_x);
  const rightX = parseFloat(coordinate.x.right_x);
  const lowerY = parseFloat(coordinate.y.lower_y);
  const upperY = parseFloat(coordinate.y.upper_y);

  // Validate coordinates
  if (isNaN(leftX) || isNaN(rightX) || isNaN(lowerY) || isNaN(upperY)) {
    return null; // Skip invalid coordinates
  }

  // Convert normalized (0-1) to screen pixels
  // No Y-axis flip needed since normalized coords already use top-origin
  const screenLeft = leftX * pageDimensions.width;
  const screenWidth = (rightX - leftX) * pageDimensions.width;
  const screenTop = upperY * pageDimensions.height;  // upperY is top edge
  const screenHeight = (lowerY - upperY) * pageDimensions.height;

  // Check for out-of-bounds (warn but still render)
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
      normalizedCoord: coordinate
    });
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

  // Log page dimensions for debugging
  console.log('='.repeat(80));
  console.log('TRANSLATION OVERLAY - PAGE DIMENSIONS:');
  console.log('  Rendered size:', pageDimensions.width, 'x', pageDimensions.height, 'px');
  console.log('  Using normalized coordinates: (0,0) = top-left, (1,1) = bottom-right');
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
        const screenCoords = convertNormalizedToScreenCoordinates(
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
          normalizedCoords: {
            x: `${element.coordinate.x.left_x} - ${element.coordinate.x.right_x}`,
            y: `${element.coordinate.y.upper_y} (top) - ${element.coordinate.y.lower_y} (bottom)`
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
