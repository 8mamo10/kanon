'use client';

import type { ExtractedElement, PageDimensions, ScreenCoordinates } from '@/lib/types';

interface TranslationOverlayProps {
  elements: ExtractedElement[];
  pageDimensions: PageDimensions;
  elementType?: 'translation' | 'dimension';
}

/**
 * Convert mm values to inches (1 inch = 25.4 mm)
 */
function convertMmToInches(value: string): string | null {
  // Skip thickness notations (e.g., "t4.5") and complex dimensions (e.g., "105x155x4.5")
  if (value.toLowerCase().startsWith('t') || value.includes('x')) {
    return null;
  }

  // Try to parse the value
  // Format 1: Plain number (e.g., "100") - assume mm for technical drawings
  // Format 2: Number with mm suffix (e.g., "100mm", "25.4 mm")
  let mmValue: number;

  // Check if it has "mm" suffix
  const mmMatch = value.match(/^([\d.]+)\s*mm$/i);
  if (mmMatch) {
    mmValue = parseFloat(mmMatch[1]);
  } else {
    // Try to parse as plain number (assume mm)
    mmValue = parseFloat(value);
  }

  if (isNaN(mmValue)) {
    return null;
  }

  // Convert mm to inches: inches = mm / 25.4
  const inches = mmValue / 25.4;

  // Format to 2 decimal places with inch symbol
  return `${inches.toFixed(2)}"`;
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

export default function TranslationOverlay({ elements, pageDimensions, elementType = 'translation' }: TranslationOverlayProps) {
  if (!elements || elements.length === 0) {
    return null;
  }

  // Log page dimensions for debugging
  console.log('='.repeat(80));
  console.log(`${elementType.toUpperCase()} OVERLAY - PAGE DIMENSIONS:`);
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
        // Determine what to display based on element type
        let displayText: string | null = null;

        if (elementType === 'dimension') {
          // For dimensions, show unit conversion
          displayText = convertMmToInches(element.value);
        } else {
          // For translations, show value_en
          displayText = element.value_en || null;
        }

        // Skip elements without display text
        if (!displayText || displayText.trim() === '') {
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
        console.log(`${elementType} Overlay [${index}]:`, {
          value: element.value,
          displayText: displayText,
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

        const tooltipText = elementType === 'dimension'
          ? `Original: ${element.value}\nConverted: ${displayText}`
          : `Original: ${element.value}\nTranslation: ${displayText}`;

        return (
          <div
            key={`overlay-${elementType}-${index}`}
            className="absolute bg-yellow-200/70 border border-yellow-400 text-xs text-gray-900 p-1 overflow-hidden pointer-events-auto"
            style={{
              left: `${screenCoords.left}px`,
              top: `${screenCoords.top}px`,
              width: `${screenCoords.width}px`,
              minHeight: `${screenCoords.height}px`,
              maxHeight: `${screenCoords.height}px`
            }}
            title={tooltipText}
          >
            <div className="line-clamp-3">
              {displayText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
