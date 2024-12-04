import * as storage from "../../lib/storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "e40323e6-d2ab-4723-a198-57a5d6ef72e4"

export default function useCaseSensitive() {
  const [value, setValue] = useState(false);

  useEffect(() => {
    storage.get(KEY, false).then(setValue);
  }, []);

  const onToggle = useCallback(() => {
    setValue(value => {
      storage.set(KEY, !value);
      return !value;
    });
  }, []);

  return [value, onToggle] as const;
}
