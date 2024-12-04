import AbcIcon from '@mui/icons-material/Abc';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { IconButton, Input } from '@mui/material';
import React from 'react';
import useCaseSensitive from '../../hooks/useCaseSensitive';

export function App() {
  const [caseSensitive, onToggleCaseSensitive] = useCaseSensitive();

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      columnGap: 4,
    }}>
      <Input
        autoFocus
        disableUnderline
        style={{ border: "none", outline: "none", flex: 1, fontFamily: "monospace", fontSize: 13 }}
      />
      <IconButton size="small" onClick={onToggleCaseSensitive}>
        <AbcIcon fontSize="small" color={caseSensitive ? "inherit" : "disabled"} />
      </IconButton>
      <IconButton size="small">
        <KeyboardArrowUpIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <KeyboardArrowDownIcon fontSize="small" />
      </IconButton>
      <IconButton size="small">
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  )
}
