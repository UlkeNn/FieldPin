import { SystemType } from "../types/workorder.enums";
import { SegmentedSelector } from "./SegmentedSelector";

const OPTIONS = [
  { label: "Sistem 1", value: SystemType.System1 },
  { label: "Sistem 2", value: SystemType.System2 },
];

type Props = { value: SystemType; onChange: (v: SystemType) => void };

export function SystemTypeSelector({ value, onChange }: Props) {
  return <SegmentedSelector options={OPTIONS} value={value} onChange={onChange} />;
}
