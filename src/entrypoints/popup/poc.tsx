import React, { useCallback, useEffect, useState } from 'react';

export function POC() {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref == null) return;
    const callback: MutationCallback = (mutationsList) => {
      console.log("---");
      for (const mut of mutationsList) {
        if (mut.type === "childList") {
          console.log("childList", mut);
        } else if (mut.type === "attributes") {
          console.log("attributes", mut);
        } else if (mut.type === "characterData") {
          console.log("characterData", mut);
        } else {
          console.log("unknown", mut);
        }
      }
    };

    const observer = new MutationObserver(callback);
    observer.observe(ref, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    })
  }, [ref]);

  const [arr, setArr] = useState<number[]>([]);
  const [txt, setTxt] = useState<string>("");

  const onClick = useCallback(() => {
    if (ref == null) return;
    const max = Math.ceil(Math.random() * 3);
    setArr([...Array(max)].map(() => Math.random()));
    setTxt(Math.random().toString());
  }, [ref]);

  return (
    <div ref={setRef} onClick={onClick} style={{
      width: 256,
      height: 256,
      backgroundColor: "gray",
    }}>
      <div>{txt}</div>
      <div id={txt}></div>
      <div>
        <div>
          {arr.map((v, i) => (
            <div key={i}>{i}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
