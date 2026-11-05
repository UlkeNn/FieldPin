import { JobType } from "../types/workorder.enums";
import { SegmentedSelector } from "./SegmentedSelector";

const OPTIONS = [
  { label: "Montaj", value: JobType.Montage },
  { label: "Değişim", value: JobType.Replace },
  { label: "Arıza", value: JobType.Fault },
];

type Props = { value: JobType; onChange: (v: JobType) => void };

export function JobTypeSelector({ value, onChange }: Props) {
  return <SegmentedSelector options={OPTIONS} value={value} onChange={onChange} />;
}
