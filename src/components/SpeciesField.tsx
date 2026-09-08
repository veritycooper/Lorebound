import { useMemo, useState } from 'react'
import { Field } from './Field'

export function SpeciesField({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (next: string) => void
}) {
  const [open, setOpen] = useState(false)
  const query = value.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!query) return options
    return options.filter((option) => option.toLowerCase().includes(query))
  }, [options, query])

  return (
    <Field label="Species">
      <div className="combobox">
        <input
          value={value}
          placeholder="Human, elf, or a name of your own"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="species-options"
          aria-autocomplete="list"
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        />
        {open && matches.length > 0 ? (
          <ul className="combobox-list" id="species-options" role="listbox">
            {matches.map((option) => (
              <li key={option} role="option" aria-selected={option.toLowerCase() === query}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onChange(option)
                    setOpen(false)
                  }}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Field>
  )
}
