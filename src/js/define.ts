import { Marker } from "../marker";

// default values
export const TEXTS: string[] = [];
export const CAIN: boolean = false;
export const MARKER_COLOR: string = "yellow";
export const FOCUSED_MARKER_COLOR: string = "orange";
export const INSTANT: boolean = true;
export const IGNORE_BLANK: boolean = true;
export const BACKGROUND: boolean = true;

// search process names
export enum Process {
  DoNothing = 1,
  Searching,
  Calculating,
  Marking,
  Finish,
  Clearing,
  Zombie,
};

export class Proc {
  status: Process;
  marker: Marker;
  text: string;
  cain: boolean;
};
