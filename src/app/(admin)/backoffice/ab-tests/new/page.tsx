"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, FlaskConical } from "lucide-react";
import { AB_TEST_ELEMENTS, type ABTestField } from "@/lib/ab-test-elements";

interface VariantForm {
  id: string;
  label: string;
  config: Record<string, string>;
  weight: number;
}

const elementKeys = Object.keys(AB_TEST_ELEMENTS);

export default function NewABTestPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetElement, setTargetElement] = useState(elementKeys[0]);
  const [variants, setVariants] = useState<VariantForm[]>([
    { id: "control", label: "Control (Original)", config: {}, weight: 50 },
    { id: "variant-a", label: "Variante A", config: {}, weight: 50 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const element = AB_TEST_ELEMENTS[targetElement];
  const fields: ABTestField[] = element?.fields || [];

  const addVariant = () => {
    const idx = variants.length;
    const letter = String.fromCharCode(65 + idx - 1); // B, C, D...
    setVariants([
      ...variants,
      {
        id: `variant-${letter.toLowerCase()}`,
        label: `Variante ${letter}`,
        config: {},
        weight: 0,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setVariants(
      variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      )
    );
  };

  const updateVariantConfig = (
    index: number,
    key: string,
    value: string
  ) => {
    setVariants(
      variants.map((v, i) =>
        i === index ? { ...v, config: { ...v.config, [key]: value } } : v
      )
    );
  };

  const distributeEvenly = () => {
    const weight = Math.floor(100 / variants.length);
    const remainder = 100 - weight * variants.length;
    setVariants(
      variants.map((v, i) => ({
        ...v,
        weight: weight + (i === 0 ? remainder : 0),
      }))
    );
  };

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("Name ist erforderlich");
      return;
    }
    if (totalWeight !== 100) {
      setError("Die Gewichtung muss insgesamt 100% ergeben");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/ab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          targetElement,
          variants: variants.map((v) => ({
            id: v.id,
            label: v.label,
            config: v.config,
            weight: v.weight,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Erstellen");
        return;
      }

      const test = await res.json();
      router.push(`/backoffice/ab-tests/${test.id}`);
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/backoffice/ab-tests"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zu A/B Tests
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FlaskConical className="h-7 w-7 text-[#FFC62C]" />
          Neuen A/B Test erstellen
        </h1>
      </div>

      {/* Form */}
      <div className="space-y-8">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Testname
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Hero CTA Text Test"
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 max-w-md"
          />
        </div>

        {/* Target Element */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Zielelement
          </label>
          <select
            value={targetElement}
            onChange={(e) => setTargetElement(e.target.value)}
            className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFC62C]/50"
          >
            {elementKeys.map((key) => (
              <option key={key} value={key}>
                {AB_TEST_ELEMENTS[key].label} ({key})
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500 mt-1.5">
            Komponente: {element?.component}
          </p>
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-zinc-300">
              Varianten
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={distributeEvenly}
                variant="outline"
                size="sm"
                className="text-xs border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Gleichmäßig verteilen
              </Button>
              <Button
                type="button"
                onClick={addVariant}
                variant="outline"
                size="sm"
                className="text-xs border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <Plus className="mr-1 h-3 w-3" />
                Variante
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {variants.map((variant, idx) => (
              <div
                key={idx}
                className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        idx === 0
                          ? "bg-zinc-400"
                          : idx === 1
                          ? "bg-[#FFC62C]"
                          : idx === 2
                          ? "bg-emerald-400"
                          : "bg-blue-400"
                      }`}
                    />
                    <Input
                      value={variant.label}
                      onChange={(e) =>
                        updateVariant(idx, "label", e.target.value)
                      }
                      className="bg-zinc-800 border-zinc-700 text-white text-sm w-48"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={variant.weight}
                        onChange={(e) =>
                          updateVariant(
                            idx,
                            "weight",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="bg-zinc-800 border-zinc-700 text-white text-sm w-20 text-right"
                      />
                      <span className="text-sm text-zinc-500">%</span>
                    </div>
                    {variants.length > 2 && (
                      <button
                        onClick={() => removeVariant(idx)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Config fields */}
                <div className="space-y-3 pl-6">
                  {fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-zinc-500 mb-1">
                        {field.label}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={variant.config[field.key] || ""}
                          onChange={(e) =>
                            updateVariantConfig(idx, field.key, e.target.value)
                          }
                          placeholder={
                            idx === 0
                              ? "(leer = Original beibehalten)"
                              : field.placeholder
                          }
                          rows={2}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#FFC62C]/50 resize-none"
                        />
                      ) : (
                        <Input
                          value={variant.config[field.key] || ""}
                          onChange={(e) =>
                            updateVariantConfig(idx, field.key, e.target.value)
                          }
                          placeholder={
                            idx === 0
                              ? "(leer = Original beibehalten)"
                              : field.placeholder
                          }
                          className="bg-zinc-800 border-zinc-700 text-white text-sm placeholder:text-zinc-600"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Weight indicator */}
          <div
            className={`mt-3 text-sm ${
              totalWeight === 100 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            Gesamt: {totalWeight}%
            {totalWeight !== 100 && " (muss 100% sein)"}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-zinc-800">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#FFC62C] text-zinc-900 hover:bg-[#FFD54F] font-semibold"
          >
            {saving ? "Erstellen..." : "Test erstellen"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <Link href="/backoffice/ab-tests">Abbrechen</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
