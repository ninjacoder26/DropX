import { clsx } from 'clsx';
import { VALLEY_DISTRICTS, type GuidedAddress } from '../lib/address';
import { Field, Input } from './ui';

/**
 * Guided Valley address picker: district → area → street/landmark.
 * Used identically at checkout and in the address book.
 */
export function AddressForm({
  value,
  onChange,
}: {
  value: GuidedAddress;
  onChange: (v: GuidedAddress) => void;
}) {
  const district = VALLEY_DISTRICTS.find((d) => d.name === value.district) ?? VALLEY_DISTRICTS[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="District">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="District">
            {VALLEY_DISTRICTS.map((d) => (
              <button
                key={d.name}
                type="button"
                role="radio"
                aria-checked={value.district === d.name}
                onClick={() => onChange({ ...value, district: d.name, area: '' })}
                className={clsx(
                  'rounded-xl border px-3 py-2.5 text-sm font-bold transition',
                  value.district === d.name
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/15 bg-white hover:border-ink/40'
                )}
              >
                {d.name}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Area / neighbourhood">
          <select
            value={value.area}
            onChange={(e) => onChange({ ...value, area: e.target.value })}
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm focus:border-ember focus:outline-none"
            aria-label="Area"
          >
            <option value="">Select your area…</option>
            {district.areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="House no., street & landmark">
          <Input
            value={value.street}
            onChange={(e) => onChange({ ...value, street: e.target.value })}
            placeholder="House 12, Lazimpat Rd — opposite City Center"
            autoComplete="street-address"
          />
        </Field>
      </div>
      <Field label="Postal code (optional)">
        <Input
          value={value.postal_code}
          onChange={(e) => onChange({ ...value, postal_code: e.target.value })}
          placeholder="44600"
          inputMode="numeric"
        />
      </Field>
    </div>
  );
}
