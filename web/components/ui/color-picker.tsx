'use client'

/**
 * Color Picker Component
 * HSL-based color picker for accent color customization
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: { h: number; s: number; l: number }
  onChange: (value: { h: number; s: number; l: number }) => void
  presets?: { h: number; s: number; l: number; label: string }[]
  showAdvanced?: boolean
  className?: string
}

const defaultPresets = [
  { h: 270, s: 70, l: 50, label: 'Purple' },
  { h: 220, s: 80, l: 50, label: 'Blue' },
  { h: 160, s: 70, l: 45, label: 'Teal' },
  { h: 142, s: 71, l: 45, label: 'Green' },
  { h: 48, s: 96, l: 53, label: 'Yellow' },
  { h: 24, s: 95, l: 53, label: 'Orange' },
  { h: 0, s: 84, l: 60, label: 'Red' },
  { h: 330, s: 80, l: 55, label: 'Pink' },
]

export function ColorPicker({
  value,
  onChange,
  presets = defaultPresets,
  showAdvanced = false,
  className,
}: ColorPickerProps) {
  const [showSliders, setShowSliders] = useState(showAdvanced)

  const handlePresetClick = useCallback(
    (preset: { h: number; s: number; l: number }) => {
      onChange(preset)
    },
    [onChange]
  )

  const handleHueChange = useCallback(
    (h: number) => {
      onChange({ ...value, h })
    },
    [value, onChange]
  )

  const handleSaturationChange = useCallback(
    (s: number) => {
      onChange({ ...value, s })
    },
    [value, onChange]
  )

  const handleLightnessChange = useCallback(
    (l: number) => {
      onChange({ ...value, l })
    },
    [value, onChange]
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preset Colors */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={cn(
              'w-10 h-10 rounded-full border-2 transition-transform hover:scale-110',
              value.h === preset.h && value.s === preset.s && value.l === preset.l
                ? 'border-text-primary ring-2 ring-accent ring-offset-2 ring-offset-background'
                : 'border-transparent'
            )}
            style={{
              backgroundColor: `hsl(${preset.h}, ${preset.s}%, ${preset.l}%)`,
            }}
            title={preset.label}
          />
        ))}
      </div>

      {/* Toggle Advanced */}
      <button
        type="button"
        onClick={() => setShowSliders(!showSliders)}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {showSliders ? 'Hide custom colors' : 'Custom color'}
      </button>

      {/* Advanced Sliders */}
      {showSliders && (
        <div className="space-y-4 p-4 bg-surface-secondary rounded-lg">
          {/* Preview */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg"
              style={{
                backgroundColor: `hsl(${value.h}, ${value.s}%, ${value.l}%)`,
              }}
            />
            <div className="text-sm text-text-secondary">
              <p>
                HSL: {value.h}, {value.s}%, {value.l}%
              </p>
            </div>
          </div>

          {/* Hue Slider */}
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Hue</label>
            <input
              type="range"
              min="0"
              max="360"
              value={value.h}
              onChange={(e) => handleHueChange(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background:
                  'linear-gradient(to right, hsl(0, 70%, 50%), hsl(60, 70%, 50%), hsl(120, 70%, 50%), hsl(180, 70%, 50%), hsl(240, 70%, 50%), hsl(300, 70%, 50%), hsl(360, 70%, 50%))',
              }}
            />
          </div>

          {/* Saturation Slider */}
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Saturation</label>
            <input
              type="range"
              min="0"
              max="100"
              value={value.s}
              onChange={(e) => handleSaturationChange(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(${value.h}, 0%, ${value.l}%), hsl(${value.h}, 100%, ${value.l}%))`,
              }}
            />
          </div>

          {/* Lightness Slider */}
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Lightness</label>
            <input
              type="range"
              min="20"
              max="80"
              value={value.l}
              onChange={(e) => handleLightnessChange(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(${value.h}, ${value.s}%, 20%), hsl(${value.h}, ${value.s}%, 50%), hsl(${value.h}, ${value.s}%, 80%))`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact color picker for inline use
 */
interface CompactColorPickerProps {
  value: { h: number; s: number; l: number }
  onChange: (value: { h: number; s: number; l: number }) => void
  className?: string
}

export function CompactColorPicker({
  value,
  onChange,
  className,
}: CompactColorPickerProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {defaultPresets.slice(0, 6).map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => onChange(preset)}
          className={cn(
            'w-6 h-6 rounded-full border transition-transform hover:scale-110',
            value.h === preset.h && value.s === preset.s && value.l === preset.l
              ? 'border-text-primary'
              : 'border-transparent'
          )}
          style={{
            backgroundColor: `hsl(${preset.h}, ${preset.s}%, ${preset.l}%)`,
          }}
          title={preset.label}
        />
      ))}
    </div>
  )
}
