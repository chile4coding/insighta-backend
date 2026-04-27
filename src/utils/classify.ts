export function classifyAge(age: number | null): string | null {
  if (age === null) return null;
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
}