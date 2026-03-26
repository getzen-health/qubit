"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Ruler, Weight, TapeMeasure } from "lucide-react";

const bmiCategories = [
  { label: "Underweight", min: 0, max: 18.5, color: "bg-blue-200 text-blue-800" },
  { label: "Normal", min: 18.5, max: 24.9, color: "bg-green-200 text-green-800" },
  { label: "Overweight", min: 25, max: 29.9, color: "bg-yellow-200 text-yellow-800" },
  { label: "Obese", min: 30, max: 100, color: "bg-red-200 text-red-800" },
];

function getBMICategory(bmi: number) {
  return bmiCategories.find((c) => bmi >= c.min && bmi < c.max) || bmiCategories[3];
}

function navyBodyFat({ waist, neck, height, gender }: { waist: number; neck: number; height: number; gender: "male" | "female" }) {
  // US Navy formula
  if (gender === "male") {
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  } else {
    // For females, need hip, but we estimate with waist/neck/height
    return 495 / (1.29579 - 0.35004 * Math.log10(waist + 0 - neck) + 0.22100 * Math.log10(height)) - 450;
  }
}

export default function BMICalculatorPage() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [waist, setWaist] = useState(80);
  const [neck, setNeck] = useState(38);
  const [gender, setGender] = useState<"male" | "female">("male");

  // Convert to metric if needed
  const heightM = unit === "metric" ? height / 100 : height * 0.0254;
  const weightKg = unit === "metric" ? weight : weight * 0.453592;
  const bmi = weightKg / (heightM * heightM);
  const category = getBMICategory(bmi);
  const waistCm = unit === "metric" ? waist : waist * 2.54;
  const neckCm = unit === "metric" ? neck : neck * 2.54;
  const waistToHeight = waistCm / (heightM * 100);
  const bodyFat = navyBodyFat({ waist: waistCm, neck: neckCm, height: heightM * 100, gender });

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Weight className="w-6 h-6" /> BMI & Body Composition Calculator
      </h1>
      <div className="flex gap-2 mb-4">
        <Button variant={unit === "metric" ? "default" : "outline"} onClick={() => setUnit("metric")}>Metric</Button>
        <Button variant={unit === "imperial" ? "default" : "outline"} onClick={() => setUnit("imperial")}>Imperial</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Height ({unit === "metric" ? "cm" : "in"})</label>
          <Input type="number" value={height} min={0} onChange={e => setHeight(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Weight ({unit === "metric" ? "kg" : "lb"})</label>
          <Input type="number" value={weight} min={0} onChange={e => setWeight(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Waist ({unit === "metric" ? "cm" : "in"})</label>
          <Input type="number" value={waist} min={0} onChange={e => setWaist(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Neck ({unit === "metric" ? "cm" : "in"})</label>
          <Input type="number" value={neck} min={0} onChange={e => setNeck(Number(e.target.value))} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select className="w-full border rounded p-2" value={gender} onChange={e => setGender(e.target.value as "male" | "female")}> 
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">BMI:</span>
          <span className="text-lg font-bold">{bmi.toFixed(1)}</span>
          <Badge className={category.color}>{category.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Waist-to-Height Ratio:</span>
          <span>{waistToHeight.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Body Fat % (Navy):</span>
          <span>{isNaN(bodyFat) ? "-" : bodyFat.toFixed(1) + "%"}</span>
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        <p>BMI = weight (kg) / [height (m)]². Navy body fat % is an estimate and may not be accurate for all body types.</p>
      </div>
    </div>
  );
}
