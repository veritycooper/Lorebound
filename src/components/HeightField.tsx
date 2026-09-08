import {
  formatHeight,
  HEIGHT_FEET_MAX,
  HEIGHT_INCHES_MAX,
  setHeightPart,
} from '../lib/entities'
import type { CharacterHeight } from '../types'

const FEET_OPTIONS = Array.from({ length: HEIGHT_FEET_MAX + 1 }, (_, feet) => feet)
const INCH_OPTIONS = Array.from({ length: HEIGHT_INCHES_MAX + 1 }, (_, inches) => inches)

export function HeightField({
  value,
  onChange,
}: {
  value: CharacterHeight | null
  onChange: (next: CharacterHeight | null) => void
}) {
  const readout = formatHeight(value)

  return (
    <div className="field">
      <span className="field-label">Height</span>
      <div className="height-pickers">
        <div className="height-unit">
          <span>Feet</span>
          <select
            className="select"
            value={value ? String(value.feet) : ''}
            aria-label="Height in feet"
            onChange={(event) => onChange(setHeightPart(value, 'feet', event.target.value))}
          >
            <option value="">—</option>
            {FEET_OPTIONS.map((feet) => (
              <option key={feet} value={feet}>
                {feet}
              </option>
            ))}
          </select>
        </div>
        <div className="height-unit">
          <span>Inches</span>
          <select
            className="select"
            value={value ? String(value.inches) : ''}
            aria-label="Height in inches"
            onChange={(event) => onChange(setHeightPart(value, 'inches', event.target.value))}
          >
            <option value="">—</option>
            {INCH_OPTIONS.map((inches) => (
              <option key={inches} value={inches}>
                {inches}
              </option>
            ))}
          </select>
        </div>
      </div>
      {readout ? <p className="height-readout">{readout}</p> : null}
    </div>
  )
}
