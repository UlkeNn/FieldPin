import { useMemo } from "react";
import { ObjectType, SystemType } from "../types/workorder.enums";
import { SegmentedSelector } from "./SegmentedSelector";

type Props = {
  value: ObjectType;
  onChange: (v: ObjectType) => void;
  systemType: SystemType;
};

export function ObjectTypeSelector({ value, onChange, systemType }: Props) {
  const options = useMemo(
    () => [
      { label: systemType === SystemType.System2 ? "TANIM" : "ARAÇ", value: ObjectType.Vehicle },
      { label: "CİHAZ", value: ObjectType.Device },
      { label: "SENSÖR", value: ObjectType.Sensor },
    ],
    [systemType],
  );

  return (
    <SegmentedSelector
      options={options}
      value={value}
      onChange={onChange}
      variant="pill"
    />
  );
}
