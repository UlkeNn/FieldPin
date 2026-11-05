import { RNFile } from "../api/workorders.api";

export enum WorkOrderObjectRole {
  Single = 0,
  Old = 1,
  New = 2,
}

export type AddedObject = {
  id: string;
  role: WorkOrderObjectRole;
  objectType: number;
  objectIdentifier: string;
  files: RNFile[];
};