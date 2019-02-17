// default values
export const TEXTS: string[] = [];
export const CAIN: boolean = false;
export const MARKER_COLOR: string = "yellow";
export const FOCUSED_MARKER_COLOR: string = "orange";
export const INSTANT: boolean = true;
export const IGNORE_BLANK: boolean = true;
export const BACKGROUND: boolean = true;

// search process names
export const Process: { [s: string]: number } = {
  DoNothing: 1,
  Searching: 2,
  Calculating: 3,
  Marking: 4,
  Finish: 5,
  Clearing: 6,
  Zombie: 7,
};
